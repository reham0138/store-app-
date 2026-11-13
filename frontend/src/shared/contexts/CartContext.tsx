import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type { ReactNode } from "react";

import type {
  CartContextType,
  CartItem,
  StoreProduct,
} from "../types/cart";

import {
  DELIVERY_FEE,
  getProductPrice,
  getProductStock,
} from "../utils/pricing";
import { useBranch } from "./useBranch";
import { CartContext } from "./cart-context";

const STORAGE_KEY = "crown-anchor-cart";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isStoreProduct(value: unknown): value is StoreProduct {
  return (
    isRecord(value) &&
    isFiniteNumber(value.id) &&
    typeof value.title === "string" &&
    typeof value.description === "string" &&
    typeof value.category === "string" &&
    isFiniteNumber(value.price) &&
    isFiniteNumber(value.discountPercentage) &&
    isFiniteNumber(value.rating) &&
    isFiniteNumber(value.stock) &&
    value.stock >= 0 &&
    typeof value.brand === "string" &&
    typeof value.thumbnail === "string" &&
    Array.isArray(value.images) &&
    value.images.every((image) => typeof image === "string") &&
    (value.branchInventory === undefined ||
      (Array.isArray(value.branchInventory) &&
        value.branchInventory.every(
          (inventory) =>
            isRecord(inventory) &&
            typeof inventory.branchId === "string" &&
            isFiniteNumber(inventory.price) &&
            isFiniteNumber(inventory.stock) &&
            inventory.price >= 0 &&
            inventory.stock >= 0,
        )))
  );
}

function isCartItem(value: unknown): value is CartItem {
  return (
    isRecord(value) &&
    isFiniteNumber(value.quantity) &&
    Number.isInteger(value.quantity) &&
    value.quantity > 0 &&
    isStoreProduct(value.product) &&
    value.quantity <= value.product.stock
  );
}

function loadCart(): CartItem[] {
  try {
    const savedCart = localStorage.getItem(STORAGE_KEY);
    if (!savedCart) return [];

    const parsed: unknown = JSON.parse(savedCart);
    if (!Array.isArray(parsed)) {
      console.warn("Saved cart data is invalid; starting with an empty cart.");
      return [];
    }

    const items = parsed.filter(isCartItem);
    if (items.length !== parsed.length) {
      console.warn("Invalid saved cart items were discarded.");
    }
    return items;
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
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [cartNotice, setCartNotice] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (!branchId || !selectedBranch) return;

    let removedCount = 0;
    let adjustedCount = 0;
    const updatedItems = items.flatMap((item) => {
      const availableStock = getProductStock(item.product, branchId);
      if (availableStock <= 0) {
        removedCount += 1;
        return [];
      }

      const quantity = Math.min(item.quantity, availableStock);
      if (quantity < item.quantity) adjustedCount += 1;
      return quantity === item.quantity ? [item] : [{ ...item, quantity }];
    });

    if (removedCount || adjustedCount) {
      // Reconcile cart state when the selected branch changes in its provider.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems(updatedItems);
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
    }
  }, [branchId, items, selectedBranch]);

  const addToCart = (product: StoreProduct, quantity = 1) => {
    const availableStock = getProductStock(product, branchId);
    if (availableStock <= 0 || quantity <= 0) return;

    setItems((previousItems) => {
      const existingItem = previousItems.find(
        (item) => item.product.id === product.id
      );

      if (existingItem) {
        return previousItems.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                product,
                quantity: Math.min(
                  item.quantity + quantity,
                  availableStock
                ),
              }
            : item
        );
      }

      return [
        ...previousItems,
        {
          product,
          quantity: Math.min(quantity, availableStock),
        },
      ];
    });
  };

  // Update quantity
  const updateQuantity = (productId: number, quantity: number) => {
    setItems((previousItems) =>
      previousItems
        .map((item) =>
          item.product.id === productId
            ? {
                ...item,
                quantity: Math.min(
                  quantity,
                  getProductStock(item.product, branchId)
                ),
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: number) => {
    setItems((previousItems) =>
      previousItems.filter(
        (item) => item.product.id !== productId
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const dismissCartNotice = () => setCartNotice(null);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + getProductPrice(item.product, branchId) * item.quantity,
        0
      ),
    [items, branchId]
  );

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
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

