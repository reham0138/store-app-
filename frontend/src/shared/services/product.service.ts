import type { StoreProduct } from "../types/cart";
import { apiClient, USE_MOCK, normalizeError, ApiError } from "../api/index.ts";
import { getStoredProducts, saveProducts } from "../utils/productStorage";
import { getAllReviews } from "../utils/reviewStorage";
import type { BranchInventory } from "../types/cart";

export type ProductSort = "default" | "price-low" | "price-high" | "rating";
export type StockStatusFilter = "in" | "low" | "out";

export interface ProductQuery {
  search?: string;
  category?: string;
  branchId?: string;
  sort?: ProductSort;
  stockStatus?: StockStatusFilter;
  page?: number;
  limit?: number;
}

export interface ProductListResponse {
  items: StoreProduct[];
  total: number;
  page: number;
  limit: number;
}

/** Catalog fields allowed on POST /products and PATCH /products/:id. */
export interface ProductInput {
  title: string;
  description: string;
  category: string;
  brand: string;
  price: number;
  discountPercentage: number;
  thumbnail: string;
  images: string[];
}

export interface ProductCreateInput extends ProductInput {
  branchInventory?: BranchInventory[];
}

const FORBIDDEN_PRODUCT_FIELDS = [
  "id",
  "stock",
  "rating",
  "reviewCount",
  "branchInventory",
] as const;

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

function assertNoForbiddenFields(input: object): void {
  const bad = FORBIDDEN_PRODUCT_FIELDS.filter((key) => key in input);
  if (bad.length > 0) {
    throw new ApiError(
      `Field(s) not allowed here: ${bad.join(", ")}.`,
      "VALIDATION_ERROR",
      400,
    );
  }
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

function branchStockOf(product: StoreProduct, branchId: string): number {
  return (
    product.branchInventory?.find((i) => i.branchId === branchId)?.stock ?? 0
  );
}

function branchPriceOf(product: StoreProduct, branchId: string): number {
  return (
    product.branchInventory?.find((i) => i.branchId === branchId)?.price ??
    product.price
  );
}

/** Reflect branch price/stock on the product, like the API does with ?branchId=. */
function reflectBranch(product: StoreProduct, branchId?: string): StoreProduct {
  if (!branchId) return product;
  return {
    ...product,
    price: branchPriceOf(product, branchId),
    stock: branchStockOf(product, branchId),
  };
}

function matchesStockStatus(
  product: StoreProduct,
  branchId: string | undefined,
  stockStatus?: StockStatusFilter,
): boolean {
  if (!stockStatus) return true;
  if (!branchId) return true;
  const stock = branchStockOf(product, branchId);
  if (stockStatus === "out") return stock === 0;
  if (stockStatus === "low") return stock > 0 && stock <= 5;
  return stock > 0;
}

function applyQuery(products: StoreProduct[], query?: ProductQuery): StoreProduct[] {
  const branchId = query?.branchId;
  const term = query?.search?.trim().toLowerCase() ?? "";
  let result = products.filter((p) => {
    const matchesSearch =
      !term ||
      [p.title, p.brand, p.description, p.category].some((v) =>
        v.toLowerCase().includes(term),
      );
    const matchesCategory = !query?.category || p.category === query.category;
    return (
      matchesSearch &&
      matchesCategory &&
      matchesStockStatus(p, branchId, query?.stockStatus)
    );
  });

  result = result.map((p) => reflectBranch(p, branchId));

  const priceOf = (p: StoreProduct) => p.price;
  switch (query?.sort) {
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

function paginate(
  items: StoreProduct[],
  page: number,
  limit: number,
): ProductListResponse {
  const start = (page - 1) * limit;
  return { items: items.slice(start, start + limit), total: items.length, page, limit };
}

function buildParams(query?: ProductQuery) {
  return {
    search: query?.search || undefined,
    category: query?.category || undefined,
    branchId: query?.branchId || undefined,
    sort: query?.sort && query.sort !== "default" ? query.sort : undefined,
    stockStatus: query?.stockStatus || undefined,
    page: query?.page ?? 1,
    limit: query?.limit ?? 40,
  };
}

/** Server-driven product list: always returns the {items,total,page,limit} envelope. */
export async function listProducts(query?: ProductQuery): Promise<ProductListResponse> {
  const page = Math.max(1, query?.page ?? 1);
  const limit = Math.min(100, Math.max(1, query?.limit ?? 40));
  if (USE_MOCK) {
    const products = await fetchMockProducts();
    return paginate(applyQuery(products, { ...query, page, limit }), page, limit);
  }
  try {
    const { data } = await apiClient.get<ProductListResponse>("/products", {
      params: buildParams({ ...query, page, limit }),
    });
    return data;
  } catch (error) {
    const normalized = normalizeError(error, "Failed to load products.");
    throw new ApiError(normalized.message, normalized.code, normalized.status);
  }
}

/** Convenience: all items of a query (pages internally, up to contract max limit). */
export async function getProducts(query?: ProductQuery): Promise<StoreProduct[]> {
  const result = await listProducts({ ...query, page: 1, limit: 100 });
  return result.items;
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

export async function createProduct(input: ProductCreateInput): Promise<StoreProduct> {
  if (USE_MOCK) {
    const products = await fetchMockProducts();
    const maxId = products.reduce((max, p) => Math.max(max, Number(p.id) || 0), 0);
    const branchInventory = input.branchInventory ?? [];
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
      stock: branchInventory.reduce((sum, i) => sum + i.stock, 0),
      thumbnail: input.thumbnail || "https://picsum.photos/seed/new-product/300/300",
      images: input.images,
      branchInventory,
    };
    mockSave([product, ...products]);
    return product;
  }
  const { data } = await apiClient.post<StoreProduct>("/products", input);
  return data;
}

/** Catalog fields only — stock/branchInventory/rating/reviewCount are rejected. */
export async function updateProduct(
  id: string,
  input: Partial<ProductInput>,
): Promise<StoreProduct> {
  assertNoForbiddenFields(input);
  if (USE_MOCK) {
    const products = await fetchMockProducts();
    const index = products.findIndex((p) => p.id === id);
    if (index < 0) throw new ApiError("Product not found.", "NOT_FOUND", 404);
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
  if (!Number.isInteger(stock) || stock < 0) {
    throw new ApiError("Stock must be an integer >= 0.", "VALIDATION_ERROR", 400);
  }
  if (USE_MOCK) {
    const { updateBranchProductStock } = await import("../utils/productStorage");
    const products = await fetchMockProducts();
    const updated = updateBranchProductStock(products, productId, branchId, stock);
    mockSave(updated);
    const product = updated.find((p) => p.id === productId);
    if (!product) throw new ApiError("Product not found.", "NOT_FOUND", 404);
    return withReviewStats(product);
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
}

/** Admin-only: set a branch-specific price. */
export async function updateBranchPrice(
  productId: string,
  branchId: string,
  price: number,
): Promise<StoreProduct> {
  if (USE_MOCK) {
    const products = await fetchMockProducts();
    const index = products.findIndex((p) => p.id === productId);
    if (index < 0) throw new ApiError("Product not found.", "NOT_FOUND", 404);
    const product = products[index];
    const inventory = [...(product.branchInventory ?? [])];
    const entryIndex = inventory.findIndex((i) => i.branchId === branchId);
    if (entryIndex >= 0) {
      inventory[entryIndex] = { ...inventory[entryIndex], price };
    } else {
      inventory.push({ branchId, price, stock: 0 });
    }
    const updated: StoreProduct = {
      ...product,
      branchInventory: inventory,
      stock: inventory.reduce((sum, i) => sum + i.stock, 0),
    };
    const next = [...products];
    next[index] = updated;
    mockSave(next);
    return withReviewStats(updated);
  }
  try {
    const { data } = await apiClient.patch<StoreProduct>(
      `/products/${productId}/branch-price`,
      { branchId, price },
    );
    return data;
  } catch (error) {
    const normalized = normalizeError(error, "Failed to update branch price.");
    throw new ApiError(normalized.message, normalized.code, normalized.status);
  }
}
