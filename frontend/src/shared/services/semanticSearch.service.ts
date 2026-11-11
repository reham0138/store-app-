import type { StoreProduct } from "../types/cart";

const SEARCH_API_URL =
  import.meta.env.VITE_SEARCH_API_URL ?? "http://127.0.0.1:8000";

interface ApiSearchResult {
  product: StoreProduct;
  score: number;
}

interface ApiSearchResponse {
  query: string;
  total: number;
  results: { id: string; score: number; item: StoreProduct }[];
}

function isInStockAtBranch(product: StoreProduct, branchId: string): boolean {
  if (!product.branchInventory) return Number(product.stock) > 0;

  return product.branchInventory.some(
    (inventory) =>
      String(inventory.branchId) === branchId && Number(inventory.stock) > 0,
  );
}

/**
 * Sends the currently loaded products to the shared semantic search API.
 * This keeps semantic search aligned with products changed in localStorage.
 */
export async function searchProductsSemantically(
  query: string,
  products: StoreProduct[],
  branchId: string,
): Promise<ApiSearchResult[]> {
  const items = products.filter((product) =>
    isInStockAtBranch(product, branchId),
  );

  if (items.length === 0) return [];

  const response = await fetch(`${SEARCH_API_URL}/search/store-products`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, items }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Semantic search API failed (${response.status}): ${detail}`);
  }

  const data = (await response.json()) as ApiSearchResponse;
  return data.results.map(({ item, score }) => ({ product: item, score }));
}
