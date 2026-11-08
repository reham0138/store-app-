import type { StoreProduct } from "../types/cart";

const SEARCH_API_URL = "http://127.0.0.1:8000";

interface ApiSearchResult {
  product: StoreProduct;
  score: number;
}

interface ApiSearchResponse {
  query: string;
  branch_id: string;
  total: number;
  results: ApiSearchResult[];
}

/**
 * Sends the currently loaded products to the Python API.
 * This keeps semantic search aligned with products changed in localStorage.
 */
export async function searchProductsSemantically(
  query: string,
  products: StoreProduct[],
  branchId: string,
): Promise<ApiSearchResult[]> {
  const response = await fetch(`${SEARCH_API_URL}/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      branch_id: branchId,
      products,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Semantic search API failed (${response.status}): ${detail}`);
  }

  const data = (await response.json()) as ApiSearchResponse;
  return data.results;
}
