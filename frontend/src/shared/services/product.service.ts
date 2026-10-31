
import type { StoreProduct } from "../types/cart";

interface ProductsResponse {
  products: StoreProduct[];
}

export async function getProducts(): Promise<StoreProduct[]> {
  const response = await fetch("/mock/products.json");

  if (!response.ok) {
    throw new Error("Failed to load products.");
  }

  const data: ProductsResponse = await response.json();

  return data.products;
}
