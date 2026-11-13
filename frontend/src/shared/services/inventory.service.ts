import type { StoreProduct } from "../types/cart";
import { apiClient, USE_MOCK, ApiError, normalizeError } from "../api/index.ts";
import { getProducts, updateProductStock } from "./product.service";

export interface InventoryRow {
  product: StoreProduct;
  branchStock: number;
  totalStock: number;
  status: "In stock" | "Low stock" | "Out of stock";
}

export function getStockStatus(stock: number): InventoryRow["status"] {
  if (stock <= 0) return "Out of stock";
  if (stock <= 10) return "Low stock";
  return "In stock";
}

async function mockList(branchId?: string): Promise<StoreProduct[]> {
  const products = await getProducts();
  if (!branchId) return products;
  return products.map((product) => ({
    ...product,
    stock:
      product.branchInventory?.find((i) => i.branchId === branchId)?.stock ?? 0,
  }));
}

async function apiList(branchId?: string): Promise<StoreProduct[]> {
  const { data } = await apiClient.get<
    | { items: StoreProduct[]; total: number; page: number; limit: number }
    | StoreProduct[]
  >("/inventory", { params: branchId ? { branchId } : undefined });
  return Array.isArray(data) ? data : data.items;
}

export const inventoryService = {
  /** Products with stock resolved for a branch (or totals when omitted). */
  list(branchId?: string): Promise<StoreProduct[]> {
    return USE_MOCK ? mockList(branchId) : apiList(branchId);
  },

  async updateStock(
    productId: string,
    branchId: string,
    stock: number,
  ): Promise<StoreProduct> {
    if (USE_MOCK) {
      return updateProductStock(productId, branchId, stock);
    }
    try {
      const { data } = await apiClient.patch<StoreProduct>(
        `/products/${productId}/stock`,
        { branchId, stock },
      );
      return data;
    } catch (error) {
      const normalized = normalizeError(error, "Failed to update stock.");
      throw new ApiError(normalized.message, normalized.code, normalized.status);
    }
  },
};
