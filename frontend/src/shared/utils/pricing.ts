import type { StoreProduct } from "../types/cart";

export const DELIVERY_FEE = 5;

export function getProductPrice(
  product: StoreProduct,
  branchId?: string,
): number {
  const discount = product.discountPercentage || 0;

  return Number(
    (getProductRegularPrice(product, branchId) * (1 - discount / 100)).toFixed(2)
  );
}

export function getProductRegularPrice(
  product: StoreProduct,
  branchId?: string,
): number {
  return (
    product.branchInventory?.find(
      (inventory) => inventory.branchId === branchId,
    )?.price ?? product.price
  );
}

export function getProductStock(
  product: StoreProduct,
  branchId?: string,
): number {
  if (!branchId || !product.branchInventory) return product.stock;
  return (
    product.branchInventory.find((inventory) => inventory.branchId === branchId)
      ?.stock ?? 0
  );
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(price);
}