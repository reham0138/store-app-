import type { ProductReview } from "../types/review";

const REVIEWS_KEY = "crown-anchor:product-reviews";

function readReviews(): ProductReview[] {
  try {
    const raw = localStorage.getItem(REVIEWS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as ProductReview[]) : [];
  } catch {
    return [];
  }
}

function writeReviews(reviews: ProductReview[]) {
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
  window.dispatchEvent(new Event("product-reviews-updated"));
}

export function getProductReviews(productId: number): ProductReview[] {
  return readReviews()
    .filter((review) => review.productId === productId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addProductReview(input: Omit<ProductReview, "id" | "createdAt">) {
  const review: ProductReview = {
    ...input,
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
    ...changes,
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
