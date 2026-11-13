
import type { StoreProduct } from "../types/cart";
import { getStoredProducts } from "../utils/productStorage";

interface ProductsResponse {
  products: StoreProduct[];
}

export async function getProducts(): Promise<StoreProduct[]> {
  const storedProducts = getStoredProducts();
  if (storedProducts) return storedProducts;

  const response = await fetch("/mock/products.json");

  if (!response.ok) {
    throw new Error("Failed to load products.");
  }

  const data = (await response.json()) as ProductsResponse;
  if (!Array.isArray(data.products)) {
    throw new Error("Products data has an invalid format.");
  }

  return data.products;
}
