import type { StoreProduct } from "../types/cart";
import { apiClient, USE_MOCK, normalizeError, ApiError } from "../api/index.ts";
import { getStoredProducts, saveProducts } from "../utils/productStorage";
import { getAllReviews } from "../utils/reviewStorage";

export interface ProductQuery {
  search?: string;
  category?: string;
  branchId?: string;
  sort?: "default" | "price-low" | "price-high" | "rating";
  page?: number;
  limit?: number;
}

export interface ProductListResponse {
  items: StoreProduct[];
  total: number;
  page: number;
  limit: number;
}

export interface ProductInput {
  title: string;
  description: string;
  category: string;
  brand: string;
  price: number;
  discountPercentage: number;
  thumbnail: string;
  images: string[];
  stock: number;
  branchInventory?: { branchId: string; price: number; stock: number }[];
}

interface ProductsResponse {
  products: StoreProduct[];
}

/** Mock products.json uses numeric ids — normalize everything to string ids. */
function normalizeProduct(raw: StoreProduct & { id: string | number }): StoreProduct {
  const product: StoreProduct = { ...raw, id: String(raw.id) };
  return withReviewStats(product);
}

function withReviewStats(product: StoreProduct): StoreProduct {
  const reviews = getAllReviews().filter((r) => r.productId === product.id);
  if (reviews.length === 0) {
    return { ...product, reviewCount: product.reviewCount ?? 0 };
  }
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  return {
    ...product,
    rating: Math.round(avg * 10) / 10,
    reviewCount: reviews.length,
  };
}

async function fetchMockProducts(): Promise<StoreProduct[]> {
  const storedProducts = getStoredProducts();
  if (storedProducts) return storedProducts.map(withReviewStats);

  const response = await fetch("/mock/products.json");
  if (!response.ok) {
    throw new Error("Failed to load products.");
  }
  const data = (await response.json()) as ProductsResponse;
  if (!Array.isArray(data.products)) {
    throw new Error("Products data has an invalid format.");
  }
  return data.products.map((p) => normalizeProduct(p as StoreProduct & { id: string | number }));
}

function mockSave(products: StoreProduct[]): void {
  saveProducts(products);
}

async function apiGetProducts(query?: ProductQuery): Promise<StoreProduct[]> {
  const { data } = await apiClient.get<ProductListResponse | StoreProduct[]>("/products", {
    params: {
      search: query?.search || undefined,
      category: query?.category || undefined,
      branchId: query?.branchId || undefined,
      sort: query?.sort && query.sort !== "default" ? query.sort : undefined,
      page: query?.page,
      limit: query?.limit ?? 200,
    },
  });
  const items = Array.isArray(data) ? data : data.items;
  return items;
}

export async function getProducts(query?: ProductQuery): Promise<StoreProduct[]> {
  if (USE_MOCK) {
    const products = await fetchMockProducts();
    return applyQuery(products, query);
  }
  try {
    return await apiGetProducts(query);
  } catch (error) {
    throw new ApiError(normalizeError(error, "Failed to load products.").message);
  }
}

function applyQuery(products: StoreProduct[], query?: ProductQuery): StoreProduct[] {
  if (!query) return products;
  const term = query.search?.trim().toLowerCase() ?? "";
  let result = products.filter((p) => {
    const matchesSearch =
      !term ||
      [p.title, p.brand, p.description, p.category].some((v) =>
        v.toLowerCase().includes(term),
      );
    const matchesCategory = !query.category || p.category === query.category;
    return matchesSearch && matchesCategory;
  });

  const branchId = query.branchId;
  const priceOf = (p: StoreProduct) =>
    p.branchInventory?.find((i) => i.branchId === branchId)?.price ?? p.price;

  switch (query.sort) {
    case "price-low":
      result = [...result].sort((a, b) => priceOf(a) - priceOf(b));
      break;
    case "price-high":
      result = [...result].sort((a, b) => priceOf(b) - priceOf(a));
      break;
    case "rating":
      result = [...result].sort((a, b) => b.rating - a.rating);
      break;
  }
  return result;
}

export async function getProduct(id: string): Promise<StoreProduct | null> {
  if (USE_MOCK) {
    const products = await fetchMockProducts();
    const found = products.find((p) => p.id === id) ?? null;
    return found ? withReviewStats(found) : null;
  }
  try {
    const { data } = await apiClient.get<StoreProduct>(`/products/${id}`);
    return data;
  } catch (error) {
    const normalized = normalizeError(error, "Product not found.");
    if (normalized.status === 404) return null;
    throw new ApiError(normalized.message, normalized.code, normalized.status);
  }
}

export async function createProduct(input: ProductInput): Promise<StoreProduct> {
  if (USE_MOCK) {
    const products = await fetchMockProducts();
    const maxId = products.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0);
    const product: StoreProduct = {
      id: String(maxId + 1),
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category.trim(),
      brand: input.brand.trim(),
      price: input.price,
      discountPercentage: input.discountPercentage,
      rating: 0,
      reviewCount: 0,
      stock: input.stock,
      thumbnail: input.thumbnail || "https://picsum.photos/seed/new-product/300/300",
      images: input.images,
      branchInventory: input.branchInventory,
    };
    mockSave([product, ...products]);
    return product;
  }
  const { data } = await apiClient.post<StoreProduct>("/products", input);
  return data;
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<StoreProduct> {
  if (USE_MOCK) {
    const products = await fetchMockProducts();
    const index = products.findIndex((p) => p.id === id);
    if (index < 0) throw new ApiError("Product not found.", undefined, 404);
    const updated: StoreProduct = {
      ...products[index],
      ...Object.fromEntries(
        Object.entries(input).map(([k, v]) => [
          k,
          typeof v === "string" ? v.trim() : v,
        ]),
      ),
    } as StoreProduct;
    const next = [...products];
    next[index] = updated;
    mockSave(next);
    return updated;
  }
  const { data } = await apiClient.patch<StoreProduct>(`/products/${id}`, input);
  return data;
}

export async function deleteProduct(id: string): Promise<void> {
  if (USE_MOCK) {
    const products = await fetchMockProducts();
    mockSave(products.filter((p) => p.id !== id));
    return;
  }
  await apiClient.delete(`/products/${id}`);
}

export async function updateProductStock(
  productId: string,
  branchId: string,
  stock: number,
): Promise<StoreProduct> {
  if (USE_MOCK) {
    const { updateBranchProductStock } = await import("../utils/productStorage");
    const products = await fetchMockProducts();
    const updated = updateBranchProductStock(products, productId, branchId, stock);
    mockSave(updated);
    const product = updated.find((p) => p.id === productId);
    if (!product) throw new ApiError("Product not found.", undefined, 404);
    return product;
  }
  const { data } = await apiClient.patch<StoreProduct>(
    `/products/${productId}/stock`,
    { branchId, stock },
  );
  return data;
}
