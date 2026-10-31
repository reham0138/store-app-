import type { StoreProduct } from "../types/cart";

export const DELIVERY_FEE = 5;

export function getProductPrice(product: StoreProduct): number {
  const discount = product.discountPercentage || 0;

  return Number(
    (product.price * (1 - discount / 100)).toFixed(2)
  );
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}