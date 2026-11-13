import type { ProductReview } from "../types/review";
import { apiClient, USE_MOCK, ApiError, normalizeError } from "../api/index.ts";
import {
  getProductReviews,
  getAllReviews,
  addProductReview,
  updateProductReview,
  deleteProductReview,
  saveReviews,
} from "../utils/reviewStorage";
import { authService } from "./authService";

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

function requireUser() {
  const user = authService.getCurrentUser();
  if (!user) {
    throw new ApiError("You must be logged in to review products.", "UNAUTHORIZED", 401);
  }
  return user;
}

// ---------- Mock ----------

function mockList(productId: string): ReviewListResponse {
  const items = getProductReviews(productId);
  return { items, total: items.length, page: 1, limit: items.length || 1 };
}

function mockUpsert(productId: string, input: ReviewInput): ProductReview {
  const user = requireUser();
  const existing = getAllReviews().find(
    (r) => r.productId === productId && r.userId === user.id,
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

function mockUpdate(reviewId: string, input: ReviewInput): ProductReview {
  const user = requireUser();
  return updateProductReview(reviewId, user.id, {
    rating: input.rating,
    comment: input.comment,
  });
}

function mockDelete(reviewId: string): void {
  const user = requireUser();
  deleteProductReview(reviewId, user.id);
}

// ---------- API ----------

async function apiList(productId: string): Promise<ReviewListResponse> {
  const { data } = await apiClient.get<ReviewListResponse | ProductReview[]>(
    `/products/${productId}/reviews`,
  );
  if (Array.isArray(data)) {
    return { items: data, total: data.length, page: 1, limit: data.length || 1 };
  }
  return data;
}

async function apiUpsert(productId: string, input: ReviewInput): Promise<ProductReview> {
  try {
    const { data } = await apiClient.post<ProductReview>(
      `/products/${productId}/reviews`,
      input,
    );
    return data;
  } catch (error) {
    const normalized = normalizeError(error, "Could not save your review.");
    throw new ApiError(normalized.message, normalized.code, normalized.status);
  }
}

async function apiUpdate(reviewId: string, input: ReviewInput): Promise<ProductReview> {
  try {
    const { data } = await apiClient.patch<ProductReview>(`/reviews/${reviewId}`, input);
    return data;
  } catch (error) {
    const normalized = normalizeError(error, "Could not update your review.");
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
  list(productId: string): Promise<ReviewListResponse> {
    return USE_MOCK ? Promise.resolve(mockList(productId)) : apiList(productId);
  },
  /** Creates or updates the current user's review for a product (one per user). */
  upsert(productId: string, input: ReviewInput): Promise<ProductReview> {
    return USE_MOCK ? Promise.resolve(mockUpsert(productId, input)) : apiUpsert(productId, input);
  },
  update(reviewId: string, input: ReviewInput): Promise<ProductReview> {
    return USE_MOCK ? Promise.resolve(mockUpdate(reviewId, input)) : apiUpdate(reviewId, input);
  },
  remove(reviewId: string): Promise<void> {
    return USE_MOCK ? Promise.resolve(mockDelete(reviewId)) : apiDelete(reviewId);
  },
};

// Re-export for components that need raw access in mock mode
export { saveReviews };
