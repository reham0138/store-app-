import {
  createContext,
  useContext,
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

import { DELIVERY_FEE, getProductPrice } from "../utils/pricing";

const STORAGE_KEY = "crown-anchor-cart";

const CartContext = createContext<CartContextType | undefined>(
  undefined
);

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
            isFiniteNumber(inventory.stock),
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
  const [items, setItems] = useState<CartItem[]>(loadCart);

  // Save cart whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Add product
  const addToCart = (product: StoreProduct, quantity = 1) => {
    if (product.stock <= 0 || quantity <= 0) return;

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
                  product.stock
                ),
              }
            : item
        );
      }

      return [
        ...previousItems,
        {
          product,
          quantity: Math.min(quantity, product.stock),
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
                  item.product.stock
                ),
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // Remove product
  const removeFromCart = (productId: number) => {
    setItems((previousItems) =>
      previousItems.filter(
        (item) => item.product.id !== productId
      )
    );
  };

  // Clear cart
  const clearCart = () => {
    setItems([]);
  };

  // Calculate totals
  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + getProductPrice(item.product) * item.quantity,
        0
      ),
    [items]
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
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// Custom Hook
export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}