import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type { ReactNode } from "react";

import type {
  CartContextType,
  CartItem,
  CartLine,
  StoreProduct,
} from "../types/cart";

import {
  DELIVERY_FEE,
  getProductPrice,
  getProductStock,
} from "../utils/pricing";
import { useBranch } from "./useBranch";
import { CartContext } from "./cart-context";
import { getProducts } from "../services/product.service";

const STORAGE_KEY = "crown-anchor-cart";
const CART_VERSION = 2;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isCartLine(value: unknown): value is CartLine {
  return (
    isRecord(value) &&
    typeof value.productId === "string" &&
    isFiniteNumber(value.quantity) &&
    Number.isInteger(value.quantity) &&
    value.quantity > 0 &&
    typeof value.branchId === "string"
  );
}

/** Migrates v1 carts ({product: StoreProduct, quantity}) to {productId, quantity, branchId}. */
function migrateLegacyLine(value: unknown): CartLine | null {
  if (!isRecord(value) || !isRecord(value.product)) return null;
  const product = value.product;
  const quantity = value.quantity;
  if (
    (typeof product.id !== "string" && typeof product.id !== "number") ||
    !isFiniteNumber(quantity) ||
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    return null;
  }
  return {
    productId: String(product.id),
    quantity,
    branchId: "",
  };
}

function loadCartLines(): CartLine[] {
  try {
    const savedCart = localStorage.getItem(STORAGE_KEY);
    if (!savedCart) return [];

    const parsed: unknown = JSON.parse(savedCart);
    const rawItems = Array.isArray(parsed)
      ? parsed
      : isRecord(parsed) && Array.isArray(parsed.items)
        ? parsed.items
        : null;
    if (!rawItems) {
      console.warn("Saved cart data is invalid; starting with an empty cart.");
      return [];
    }

    const lines = rawItems
      .map((value) => (isCartLine(value) ? value : migrateLegacyLine(value)))
      .filter((line): line is CartLine => line !== null);
    return lines;
  } catch (error) {
    console.warn("Unable to load saved cart; starting with an empty cart.", error);
    return [];
  }
}

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const { selectedBranch } = useBranch();
  const branchId = selectedBranch?.id;
  const [lines, setLines] = useState<CartLine[]>(loadCartLines);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [cartNotice, setCartNotice] = useState<string | null>(null);

  const loadProducts = () => {
    getProducts()
      .then((loaded) => setProducts(loaded))
      .catch((error) => {
        console.warn("Unable to load products for cart.", error);
      })
      .finally(() => setProductsLoaded(true));
  };

  useEffect(() => {
    let isMounted = true;
    getProducts()
      .then((loaded) => {
        if (isMounted) setProducts(loaded);
      })
      .catch((error) => {
        console.warn("Unable to load products for cart.", error);
      })
      .finally(() => {
        if (isMounted) setProductsLoaded(true);
      });
    const refresh = () => loadProducts();
    window.addEventListener("products-updated", refresh);
    return () => {
      isMounted = false;
      window.removeEventListener("products-updated", refresh);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: CART_VERSION, items: lines }),
    );
  }, [lines]);

  const productMap = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  const items = useMemo<CartItem[]>(() => {
    return lines.flatMap((line) => {
      const product = productMap.get(line.productId);
      return product ? [{ product, quantity: line.quantity }] : [];
    });
  }, [lines, productMap]);

  // Reconcile quantities against the selected branch's stock.
  useEffect(() => {
    if (!branchId || !selectedBranch || !productsLoaded) return;

    let removedCount = 0;
    let adjustedCount = 0;
    const updatedLines = lines.flatMap((line) => {
      const product = productMap.get(line.productId);
      if (!product) {
        removedCount += 1;
        return [];
      }
      const availableStock = getProductStock(product, branchId);
      if (availableStock <= 0) {
        removedCount += 1;
        return [];
      }

      const quantity = Math.min(line.quantity, availableStock);
      if (quantity < line.quantity) adjustedCount += 1;
      return quantity === line.quantity
        ? [line]
        : [{ ...line, quantity, branchId }];
    });

    if (removedCount || adjustedCount) {
      queueMicrotask(() => {
        setLines(updatedLines);
        const changes = [
          removedCount
            ? `${removedCount} item${removedCount === 1 ? "" : "s"} unavailable and removed`
            : "",
          adjustedCount
            ? `${adjustedCount} item${adjustedCount === 1 ? "" : "s"} quantity adjusted to branch stock`
            : "",
        ].filter(Boolean);
        setCartNotice(
          `Your cart was updated for ${selectedBranch.name}: ${changes.join("; ")}.`,
        );
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId, productsLoaded]);

  const addToCart = (product: StoreProduct, quantity = 1) => {
    const availableStock = getProductStock(product, branchId);
    if (availableStock <= 0 || quantity <= 0) return;

    setLines((previousLines) => {
      const existing = previousLines.find(
        (line) => line.productId === product.id,
      );

      if (existing) {
        return previousLines.map((line) =>
          line.productId === product.id
            ? {
                ...line,
                quantity: Math.min(line.quantity + quantity, availableStock),
                branchId: branchId ?? line.branchId,
              }
            : line,
        );
      }

      return [
        ...previousLines,
        {
          productId: product.id,
          quantity: Math.min(quantity, availableStock),
          branchId: branchId ?? "",
        },
      ];
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    setLines((previousLines) =>
      previousLines
        .map((line) => {
          if (line.productId !== productId) return line;
          const product = productMap.get(productId);
          const cap = product ? getProductStock(product, branchId) : line.quantity;
          return { ...line, quantity: Math.min(quantity, cap) };
        })
        .filter((line) => line.quantity > 0),
    );
  };

  const removeFromCart = (productId: string) => {
    setLines((previousLines) =>
      previousLines.filter((line) => line.productId !== productId),
    );
  };

  const clearCart = () => {
    setLines([]);
  };

  const dismissCartNotice = () => setCartNotice(null);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + getProductPrice(item.product, branchId) * item.quantity,
        0,
      ),
    [items, branchId],
  );

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const deliveryFee = items.length > 0 ? DELIVERY_FEE : 0;

  const total = subtotal + deliveryFee;

  const value: CartContextType = {
    items,
    totalItems,
    subtotal,
    deliveryFee,
    total,
    cartNotice,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    dismissCartNotice,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}
