import type { BranchInventory, StoreProduct } from "../types/cart";

const STORAGE_KEY = "crown-anchor-dashboard-products";

function isBranchInventory(value: unknown): value is BranchInventory {
  if (typeof value !== "object" || value === null) return false;

  const inventory = value as Record<string, unknown>;
  return (
    typeof inventory.branchId === "string" &&
    typeof inventory.price === "number" &&
    typeof inventory.stock === "number"
  );
}

function isStoreProduct(value: unknown): value is StoreProduct {
  if (typeof value !== "object" || value === null) return false;

  const product = value as Record<string, unknown>;
  return (
    typeof product.id === "number" &&
    typeof product.title === "string" &&
    typeof product.description === "string" &&
    typeof product.category === "string" &&
    typeof product.price === "number" &&
    typeof product.discountPercentage === "number" &&
    typeof product.rating === "number" &&
    typeof product.stock === "number" &&
    typeof product.brand === "string" &&
    typeof product.thumbnail === "string" &&
    Array.isArray(product.images) &&
    product.images.every((image) => typeof image === "string") &&
    (product.branchInventory === undefined ||
      (Array.isArray(product.branchInventory) &&
        product.branchInventory.every(isBranchInventory)))
  );
}

export function getStoredProducts(): StoreProduct[] | null {
  const savedProducts = localStorage.getItem(STORAGE_KEY);
  if (savedProducts === null) return null;

  let parsedProducts: unknown;
  try {
    parsedProducts = JSON.parse(savedProducts);
  } catch {
    throw new Error("Saved product data is invalid.");
  }

  if (!Array.isArray(parsedProducts) || !parsedProducts.every(isStoreProduct)) {
    throw new Error("Saved product data has an invalid format.");
  }

  return parsedProducts;
}

export function saveProducts(products: StoreProduct[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}
