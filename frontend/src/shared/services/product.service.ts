import type { StoreProduct } from "../types/cart";
import { apiClient, USE_MOCK, normalizeError, ApiError } from "../api/index.ts";
import { getStoredProducts, saveProducts } from "../utils/productStorage";
import { getAllReviews } from "../utils/reviewStorage";
import type { BranchInventory } from "../types/cart";
import { normalizePage, readId } from "../api/backendShapes";
import { getCategories } from "./categories.service";

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
  branchId?: string;
  categoryId?: string;
  stock?: number;
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

interface BackendProduct {
  id?: string;
  _id?: string;
  name?: string;
  sku?: string;
  brand?: string;
  description?: string;
  price?: number;
  category?: string | { _id?: string; id?: string; name?: string };
  categoryId?: string | { _id?: string; id?: string; name?: string };
  stock?: number;
  rating?: number;
  reviewCount?: number;
  thumbnail?: string;
  images?: string[];
  branchInventory?: BranchInventory[];
}

const DEFAULT_BRANCH_ID = import.meta.env.VITE_DEFAULT_BRANCH_ID?.trim();
const PLACEHOLDER_IMAGE = "/brand/logo/the-crown-anchor-logo-black.png";
const MONGO_OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

function assertMongoBranchId(branchId: string): void {
  if (!MONGO_OBJECT_ID_PATTERN.test(branchId)) {
    throw new ApiError(
      "The branch ID must be the branch's 24-character MongoDB ObjectId, not its name or code.",
      "VALIDATION_ERROR",
      400,
    );
  }
}

function categoryFields(raw: BackendProduct): { category: string; categoryId?: string } {
  const source = raw.categoryId ?? raw.category;
  if (typeof source === "object" && source !== null) {
    const categoryId = source.id ?? source._id;
    return {
      category: source.name ?? (typeof categoryId === "string" ? categoryId : ""),
      ...(typeof categoryId === "string" ? { categoryId } : {}),
    };
  }
  if (typeof source === "string") {
    return { category: raw.category && typeof raw.category === "string" ? raw.category : source, categoryId: source };
  }
  return { category: "" };
}

function mapBackendProduct(
  raw: BackendProduct,
  branchId: string,
  categoryNames: Map<string, string>,
): StoreProduct {
  const category = categoryFields(raw);
  const categoryId = category.categoryId;
  const price = typeof raw.price === "number" ? raw.price : 0;
  const stock = typeof raw.stock === "number" ? raw.stock : 0;
  const branchInventory = Array.isArray(raw.branchInventory)
    ? raw.branchInventory
    : [{ branchId, price, stock }];

  return {
    id: readId(raw),
    title: raw.name ?? "",
    description: raw.description ?? "",
    category: categoryId ? categoryNames.get(categoryId) ?? category.category : category.category,
    categoryId,
    brand: raw.sku ?? raw.brand ?? "",
    price,
    discountPercentage: 0,
    rating: typeof raw.rating === "number" ? raw.rating : 0,
    reviewCount: typeof raw.reviewCount === "number" ? raw.reviewCount : 0,
    stock,
    thumbnail: raw.thumbnail ?? PLACEHOLDER_IMAGE,
    images: Array.isArray(raw.images) ? raw.images : [],
    branchInventory,
  };
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
    const matchesCategory =
      !query?.category ||
      p.categoryId === query.category ||
      p.category === query.category;
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

function buildParams(query: ProductQuery & { branchId: string }) {
  return {
    search: query?.search || undefined,
    categoryId: query?.category || undefined,
    branchId: query.branchId,
    sort:
      query?.sort === "price-low"
        ? "price_asc"
        : query?.sort === "price-high"
          ? "price_desc"
          : query?.sort === "rating"
            ? "newest"
            : "newest",
    page: query?.page ?? 1,
    limit: query?.limit ?? 12,
  };
}

/** Server-driven product list: always returns the {items,total,page,limit} envelope. */
export async function listProducts(query?: ProductQuery): Promise<ProductListResponse> {
  const branchId = query?.branchId ?? DEFAULT_BRANCH_ID;
  if (!branchId) {
    throw new ApiError(
      "A MongoDB branch ID is required. Set VITE_DEFAULT_BRANCH_ID or select an available branch.",
      "VALIDATION_ERROR",
      400,
    );
  }
  assertMongoBranchId(branchId);
  const page = Math.max(1, query?.page ?? 1);
  const limit = Math.min(100, Math.max(1, query?.limit ?? 40));
  if (USE_MOCK) {
    const products = await fetchMockProducts();
    return paginate(applyQuery(products, { ...query, page, limit }), page, limit);
  }
  try {
    const categories = await getCategories();
    const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
    const request = async (targetPage: number, stockStatus?: StockStatusFilter) => {
      const { data } = await apiClient.get<{
        data: BackendProduct[];
        meta: { page: number; limit: number; total: number };
      }>("/products", {
        params: {
          ...buildParams({ ...query, branchId, page: targetPage, limit: stockStatus ? 100 : limit }),
          page: targetPage,
        },
      });
      const normalized = normalizePage(data);
      return {
        ...normalized,
        items: normalized.items.map((product) => mapBackendProduct(product, branchId, categoryNames)),
        stockStatus,
      };
    };

    if (query?.stockStatus) {
      const first = await request(1, query.stockStatus);
      const all = [...first.items];
      const totalPages = Math.ceil(first.total / first.limit);
      for (let targetPage = 2; targetPage <= totalPages; targetPage += 1) {
        all.push(...(await request(targetPage, query.stockStatus)).items);
      }
      const filtered = all.filter((product) => {
        if (query.stockStatus === "out") return product.stock === 0;
        if (query.stockStatus === "low") return product.stock > 0 && product.stock <= 5;
        return product.stock > 0;
      });
      const start = (page - 1) * limit;
      return { items: filtered.slice(start, start + limit), total: filtered.length, page, limit };
    }

    const normalized = await request(page);
    return normalized;
  } catch (error) {
    const normalized = normalizeError(error, "Failed to load products.");
    throw new ApiError(normalized.message, normalized.code, normalized.status);
  }
}

/** Convenience: all items of a query (pages internally, up to contract max limit). */
export async function getProducts(query?: ProductQuery): Promise<StoreProduct[]> {
  const first = await listProducts({ ...query, page: 1, limit: 100 });
  const items = [...first.items];
  const pages = Math.ceil(first.total / first.limit);
  for (let page = 2; page <= pages; page += 1) {
    items.push(...(await listProducts({ ...query, page, limit: 100 })).items);
  }
  return items;
}

export async function getProduct(id: string, branchId?: string): Promise<StoreProduct | null> {
  if (USE_MOCK) {
    const products = await fetchMockProducts();
    const found = products.find((p) => p.id === id) ?? null;
    return found ? withReviewStats(found) : null;
  }
  try {
    const resolvedBranchId = branchId ?? DEFAULT_BRANCH_ID;
    if (!resolvedBranchId) {
      throw new ApiError("A MongoDB branch ID is required to load a product.", "VALIDATION_ERROR", 400);
    }
    assertMongoBranchId(resolvedBranchId);
    const { data } = await apiClient.get<BackendProduct>(`/products/${id}`, {
      params: { branchId: resolvedBranchId },
    });
    const categories = await getCategories();
    return mapBackendProduct(
      data,
      resolvedBranchId,
      new Map(categories.map((category) => [category.id, category.name])),
    );
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
  const branchId = input.branchId ?? input.branchInventory?.[0]?.branchId ?? DEFAULT_BRANCH_ID;
  const categoryId = input.categoryId ?? input.category;
  const stock = input.stock ?? input.branchInventory?.find((item) => item.branchId === branchId)?.stock;
  if (!branchId || !categoryId || stock === undefined) {
    throw new ApiError("Creating a product requires a branch ID, category ID, and stock quantity.", "VALIDATION_ERROR", 400);
  }
  const { data } = await apiClient.post<BackendProduct>("/products", {
    name: input.title,
    sku: input.brand,
    description: input.description,
    price: input.price,
    categoryId,
    branchId,
    stock,
  });
  const categories = await getCategories();
  return mapBackendProduct(data, branchId, new Map(categories.map((category) => [category.id, category.name])));
}

/** Catalog fields only — stock/branchInventory/rating/reviewCount are rejected. */
export async function updateProduct(
  id: string,
  input: Partial<ProductInput>,
  branchId?: string,
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
  const resolvedBranchId = branchId ?? DEFAULT_BRANCH_ID;
  if (!resolvedBranchId) {
    throw new ApiError("Updating a product requires a MongoDB branch ID.", "VALIDATION_ERROR", 400);
  }
  const body: Record<string, unknown> = {};
  if (input.title !== undefined) body.name = input.title;
  if (input.brand !== undefined) body.sku = input.brand;
  if (input.description !== undefined) body.description = input.description;
  if (input.price !== undefined) body.price = input.price;
  if (input.category !== undefined) body.categoryId = input.category;
  const { data } = await apiClient.patch<BackendProduct>(`/products/${id}`, body, {
    params: { branchId: resolvedBranchId },
  });
  const categories = await getCategories();
  return mapBackendProduct(data, resolvedBranchId, new Map(categories.map((category) => [category.id, category.name])));
}

export async function deleteProduct(id: string, branchId?: string): Promise<void> {
  if (USE_MOCK) {
    const products = await fetchMockProducts();
    mockSave(products.filter((p) => p.id !== id));
    return;
  }
  const resolvedBranchId = branchId ?? DEFAULT_BRANCH_ID;
  if (!resolvedBranchId) {
    throw new ApiError("Deleting a product requires a MongoDB branch ID.", "VALIDATION_ERROR", 400);
  }
  await apiClient.delete(`/products/${id}`, { params: { branchId: resolvedBranchId } });
}

export async function updateProductStock(
  productId: string,
  branchId: string,
  delta: number,
): Promise<StoreProduct> {
  if (!Number.isInteger(delta) || delta === 0) {
    throw new ApiError("Stock change must be a non-zero integer.", "VALIDATION_ERROR", 400);
  }
  if (USE_MOCK) {
    const { updateBranchProductStock } = await import("../utils/productStorage");
    const products = await fetchMockProducts();
    const currentStock = products
      .find((product) => product.id === productId)
      ?.branchInventory?.find((entry) => entry.branchId === branchId)?.stock ?? 0;
    const stock = currentStock + delta;
    if (stock < 0) {
      throw new ApiError("Stock cannot go below zero.", "VALIDATION_ERROR", 400);
    }
    const updated = updateBranchProductStock(products, productId, branchId, stock);
    mockSave(updated);
    const product = updated.find((p) => p.id === productId);
    if (!product) throw new ApiError("Product not found.", "NOT_FOUND", 404);
    return withReviewStats(product);
  }
  try {
    const { data } = await apiClient.patch<BackendProduct>(
      `/products/${productId}/stock`,
      { delta },
      { params: { branchId } },
    );
    const categories = await getCategories();
    return mapBackendProduct(data, branchId, new Map(categories.map((category) => [category.id, category.name])));
  } catch (error) {
    const normalized = normalizeError(error, "Failed to update stock.");
    throw new ApiError(normalized.message, normalized.code, normalized.status);
  }
}

