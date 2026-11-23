import { apiClient, USE_MOCK } from "../api";
import { readId } from "../api/backendShapes";

export interface StoreCategory {
  id: string;
  name: string;
}

interface BackendCategory {
  id?: string;
  _id?: string;
  name: string;
}

let cachedCategories: { expiresAt: number; value: Promise<StoreCategory[]> } | null = null;

export async function getCategories(): Promise<StoreCategory[]> {
  if (cachedCategories && cachedCategories.expiresAt > Date.now()) {
    return cachedCategories.value;
  }

  const value = (async () => {
    if (USE_MOCK) {
      const { getProducts } = await import("./product.service");
      const products = await getProducts();
      const categories = new Map<string, StoreCategory>();
      for (const product of products) {
        const id = product.categoryId ?? product.category;
        if (id) categories.set(id, { id, name: product.category });
      }
      return [...categories.values()].sort((a, b) => a.name.localeCompare(b.name));
    }

    const { data } = await apiClient.get<BackendCategory[]>("/categories");
    if (!Array.isArray(data)) {
      throw new Error("The backend returned an invalid category list.");
    }
    return data
      .map((category) => ({ id: readId(category), name: category.name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  })();

  cachedCategories = { expiresAt: Date.now() + 60_000, value };
  try {
    return await value;
  } catch (error) {
    cachedCategories = null;
    throw error;
  }
}
