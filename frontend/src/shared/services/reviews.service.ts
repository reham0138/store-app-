import type { ProductReview } from "../types/review";
import { apiClient, USE_MOCK, ApiError, normalizeError } from "../api/index.ts";
import {
  getProductReviews,
  addProductReview,
  updateProductReview,
  deleteProductReview,
} from "../utils/reviewStorage";
import { authService } from "./authService";
import { normalizePage, readId } from "../api/backendShapes";

export interface ReviewListResponse {
  items: ProductReview[];
  total: number;
  page: number;
  limit: number;
}

export interface ReviewInput {
  rating: number;
  comment?: string;
}

interface BackendReview {
  id?: string;
  _id?: string;
  productId: string | { id?: string; _id?: string };
  userId: string | { id?: string; _id?: string; name?: string };
  userName?: string;
  rating: number;
  comment?: string;
  createdAt: string;
  updatedAt?: string;
}

function relationId(value: string | { id?: string; _id?: string }): string {
  if (typeof value === "string") return value;
  const id = value.id ?? value._id;
  if (!id) throw new Error("The reviews API returned an invalid entity ID.");
  return id;
}

function mapBackendReview(raw: BackendReview): ProductReview {
  const user = typeof raw.userId === "object" ? raw.userId : undefined;
  return {
    id: readId(raw),
    productId: relationId(raw.productId),
    userId: relationId(raw.userId),
    userName: raw.userName ?? user?.name ?? "Customer",
    rating: raw.rating,
    comment: raw.comment,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

const DEFAULT_LIMIT = 10;

function requireUser() {
  const user = authService.getCurrentUser();
  if (!user) {
    throw new ApiError("You must be logged in to review products.", "UNAUTHORIZED", 401);
  }
  return user;
}

// ---------- Mock ----------

function mockList(productId: string, page: number, limit: number): ReviewListResponse {
  const all = getProductReviews(productId);
  const start = (page - 1) * limit;
  return {
    items: all.slice(start, start + limit),
    total: all.length,
    page,
    limit,
  };
}

function mockUpsert(productId: string, input: ReviewInput): ProductReview {
  const user = requireUser();
  const existing = getProductReviews(productId).find(
    (r) => r.userId === user.id,
  );
  if (existing) {
    return updateProductReview(existing.id, user.id, {
      rating: input.rating,
      comment: input.comment,
    });
  }
  return addProductReview({
    productId,
    userId: user.id,
    userName: user.name,
    rating: input.rating,
    comment: input.comment,
  });
}

function mockDelete(reviewId: string): void {
  const user = requireUser();
  deleteProductReview(reviewId, user.id);
}

// ---------- API ----------

async function apiList(
  productId: string,
  page: number,
  limit: number,
): Promise<ReviewListResponse> {
  const { data } = await apiClient.get<{
    data: BackendReview[];
    meta: { page: number; limit: number; total: number; totalPages?: number };
  }>(
    `/products/${productId}/reviews`,
    { params: { page, limit } },
  );
  const pageData = normalizePage(data);
  return { ...pageData, items: pageData.items.map(mapBackendReview) };
}

async function apiUpsert(productId: string, input: ReviewInput): Promise<ProductReview> {
  try {
    const { data } = await apiClient.post<BackendReview>(
      `/products/${productId}/reviews`,
      input,
    );
    return mapBackendReview(data);
  } catch (error) {
    const normalized = normalizeError(error, "Could not save your review.");
    throw new ApiError(normalized.message, normalized.code, normalized.status);
  }
}

async function apiDelete(reviewId: string): Promise<void> {
  try {
    await apiClient.delete(`/reviews/${reviewId}`);
  } catch (error) {
    const normalized = normalizeError(error, "Could not delete your review.");
    throw new ApiError(normalized.message, normalized.code, normalized.status);
  }
}

// ---------- Public API ----------

export const reviewsService = {
  list(productId: string, page = 1, limit = DEFAULT_LIMIT): Promise<ReviewListResponse> {
    return USE_MOCK
      ? Promise.resolve(mockList(productId, page, limit))
      : apiList(productId, page, limit);
  },
  /** Creates or updates the current user's single review for a product (upsert). */
  upsert(productId: string, input: ReviewInput): Promise<ProductReview> {
    return USE_MOCK ? Promise.resolve(mockUpsert(productId, input)) : apiUpsert(productId, input);
  },
  remove(reviewId: string): Promise<void> {
    return USE_MOCK ? Promise.resolve(mockDelete(reviewId)) : apiDelete(reviewId);
  },
};
