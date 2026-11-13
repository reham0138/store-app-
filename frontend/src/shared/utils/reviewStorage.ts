import type { ProductReview } from "../types/review";

const REVIEWS_KEY = "crown-anchor:product-reviews";

function isReview(value: unknown): value is ProductReview {
  if (typeof value !== "object" || value === null) return false;
  const review = value as Record<string, unknown>;
  return (
    typeof review.id === "string" &&
    typeof review.productId === "string" &&
    typeof review.userId === "string" &&
    typeof review.userName === "string" &&
    typeof review.rating === "number" &&
    review.rating >= 1 &&
    review.rating <= 5 &&
    typeof review.createdAt === "string"
  );
}

/** Migrates legacy reviews stored with numeric productId. */
function normalizeReview(value: unknown): ProductReview | null {
  if (isReview(value)) return value;
  if (typeof value !== "object" || value === null) return null;
  const review = value as Record<string, unknown>;
  if (typeof review.productId === "number") {
    return { ...(review as unknown as ProductReview), productId: String(review.productId) };
  }
  return null;
}

function readReviews(): ProductReview[] {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normalizeReview)
      .filter((review): review is ProductReview => review !== null);
  } catch {
    return [];
  }
}

function writeReviews(reviews: ProductReview[]) {
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  window.dispatchEvent(new Event("product-reviews-updated"));
}

export function getAllReviews(): ProductReview[] {
  return readReviews();
}

export function getProductReviews(productId: string): ProductReview[] {
  return readReviews()
    .filter((review) => review.productId === productId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveReviews(reviews: ProductReview[]): void {
  writeReviews(reviews);
}

export function addProductReview(input: Omit<ProductReview, "id" | "createdAt">) {
  const review: ProductReview = {
    ...input,
    comment: input.comment?.trim() || undefined,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  writeReviews([...readReviews(), review]);
  return review;
}

export function updateProductReview(
  reviewId: string,
  userId: string,
  changes: Pick<ProductReview, "rating" | "comment">,
) {
  const reviews = readReviews();
  const index = reviews.findIndex((review) => review.id === reviewId);
  if (index < 0) throw new Error("Review not found.");
  if (reviews[index].userId !== userId) {
    throw new Error("You can only edit your own review.");
  }

  const updated = {
    ...reviews[index],
    rating: changes.rating,
    comment: changes.comment?.trim() || undefined,
    updatedAt: new Date().toISOString(),
  };
  reviews[index] = updated;
  writeReviews(reviews);
  return updated;
}

export function deleteProductReview(reviewId: string, userId: string) {
  const reviews = readReviews();
  const review = reviews.find((item) => item.id === reviewId);
  if (!review) throw new Error("Review not found.");
  if (review.userId !== userId) {
    throw new Error("You can only delete your own review.");
  }
  writeReviews(reviews.filter((item) => item.id !== reviewId));
}
