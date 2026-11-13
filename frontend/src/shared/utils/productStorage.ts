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

export function updateBranchProductStock(
  products: StoreProduct[],
  productId: number,
  branchId: string,
  stock: number,
): StoreProduct[] {
  if (!branchId.trim()) {
    throw new Error("A branch must be selected to update stock.");
  }
  if (!Number.isInteger(stock) || stock < 0) {
    throw new Error("Stock must be a non-negative whole number.");
  }

  const product = products.find((item) => item.id === productId);
  if (!product) {
    throw new Error("The selected product could not be found.");
  }

  const branchInventory = product.branchInventory ?? [];
  const existingBranchInventory = branchInventory.find(
    (inventory) => inventory.branchId === branchId,
  );
  const updatedBranchInventory = existingBranchInventory
    ? branchInventory.map((inventory) =>
        inventory.branchId === branchId ? { ...inventory, stock } : inventory,
      )
    : [...branchInventory, { branchId, price: product.price, stock }];

  return products.map((item) =>
    item.id === productId
      ? {
          ...item,
          branchInventory: updatedBranchInventory,
          stock: updatedBranchInventory.reduce(
            (total, inventory) => total + inventory.stock,
            0,
          ),
        }
      : item,
  );
}
