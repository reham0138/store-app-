import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import ProductRating from "../shared/components/ProductRating";
import { useAuth } from "../shared/hooks/useAuth";
import type { ProductReview } from "../shared/types/review";
import { formatPrice, getProductPrice } from "../shared/utils/pricing";
import { useBranch } from "../shared/contexts/useBranch";
import { normalizeError } from "../shared/api/errors";
import {
  useDeleteReviewMutation,
  useInfiniteReviewsQuery,
  useProductQuery,
  useUpsertReviewMutation,
} from "../shared/hooks/useApiQueries";

const REVIEWS_PAGE_SIZE = 10;
const EMPTY_REVIEWS: ProductReview[] = [];

export default function ProductDetailsPage() {
  const { productId } = useParams<{ productId: string }>();
  return <ProductDetails key={productId ?? ""} productId={productId} />;
}

function ProductDetails({ productId }: { productId?: string }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedBranch } = useBranch();
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [editingReview, setEditingReview] = useState<ProductReview | null>(null);
  const [formError, setFormError] = useState("");
  const [activeImage, setActiveImage] = useState("");
  const productQuery = useProductQuery(productId, selectedBranch?.id);
  const reviewsQuery = useInfiniteReviewsQuery(productId ?? "", REVIEWS_PAGE_SIZE);
  const upsertReviewMutation = useUpsertReviewMutation(productId ?? "");
  const deleteReviewMutation = useDeleteReviewMutation(productId ?? "");
  const product = productQuery.data ?? null;
  const productImages = product
    ? [...new Set([product.thumbnail, ...product.images].filter(Boolean))]
    : [];
  const selectedImage = productImages.includes(activeImage)
    ? activeImage
    : productImages[0];
  const loading = productQuery.isLoading || reviewsQuery.isLoading;
  const loadingMore = reviewsQuery.isFetchingNextPage;
  const reviews = reviewsQuery.data?.pages.flatMap((page) => page.items) ?? EMPTY_REVIEWS;
  const reviewsTotal = reviewsQuery.data?.pages[0]?.total ?? 0;
  const submitting = upsertReviewMutation.isPending || deleteReviewMutation.isPending;
  const error = productQuery.error
    ? normalizeError(productQuery.error, "Unable to load product.").message
    : productQuery.data === null && !productQuery.isLoading
      ? "Product not found."
      : "";

  async function loadMoreReviews() {
    if (!productId || loadingMore || !reviewsQuery.hasNextPage) return;
    await reviewsQuery.fetchNextPage();
  }

  const myReview = useMemo(
    () => reviews.find((review) => review.userId === user?.id) ?? null,
    [reviews, user],
  );

  function resetForm() {
    setRating("5");
    setComment("");
    setEditingReview(null);
    setFormError("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !product || submitting) return;

    const parsedRating = Number(rating);
    const trimmedComment = comment.trim();
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      setFormError("Choose a rating from 1 to 5.");
      return;
    }
    if (!trimmedComment) {
      setFormError("Please write a comment for your review.");
      return;
    }
    if (trimmedComment.length > 500) {
      setFormError("Comment must be 500 characters or fewer.");
      return;
    }

    setFormError("");
    try {
      // POST upserts the user's single review for this product.
      await upsertReviewMutation.mutateAsync({
        rating: parsedRating,
        comment: trimmedComment,
      });
      resetForm();
    } catch (submitError) {
      setFormError(normalizeError(submitError, "Unable to save review.").message);
    }
  }

  function startEditing(review: ProductReview) {
    if (!user || review.userId !== user.id) return;
    setEditingReview(review);
    setRating(String(review.rating));
    setComment(review.comment ?? "");
    setFormError("");
  }

  async function handleDelete(review: ProductReview) {
    if (!user || review.userId !== user.id || submitting) return;
    setFormError("");
    try {
      await deleteReviewMutation.mutateAsync(review.id);
      if (editingReview?.id === review.id) resetForm();
    } catch (deleteError) {
      setFormError(normalizeError(deleteError, "Unable to delete review.").message);
    }
  }

  if (loading) {
    return <p className="mx-auto max-w-7xl px-4 py-20 text-center text-text-slate">Loading product...</p>;
  }

  if (error || !product) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-20 text-center">
        <p className="text-status-error">{error || "Product not found."}</p>
        <button
          type="button"
          onClick={() => {
            void productQuery.refetch();
          }}
          className="mt-4 inline-flex text-sm font-semibold text-brand-navy underline"
        >
          Try again
        </button>
        <Link to="/products" className="mt-4 ms-4 inline-flex text-sm font-semibold text-brand-navy underline">
          Back to products
        </Link>
      </section>
    );
  }

  const hasMoreReviews = reviewsQuery.hasNextPage;

  return (
    <div className="min-h-screen bg-page">
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <button type="button" onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-navy">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="grid gap-8 rounded-2xl border border-border-subtle bg-surface-white p-5 md:grid-cols-2 md:p-8">
          <div>
            <img
              src={selectedImage ?? product.thumbnail}
              alt={product.title}
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src =
                  "/brand/logo/the-crown-anchor-logo-black.png";
              }}
              className="h-80 w-full rounded-xl border border-border-subtle bg-surface-cream p-2 object-contain"
            />
            {productImages.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
                {productImages.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    onClick={() => setActiveImage(image)}
                    aria-label={`Show product image ${index + 1}`}
                    aria-pressed={selectedImage === image}
                    className={`shrink-0 rounded-lg border p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-gold ${
                      selectedImage === image
                        ? "border-brand-gold bg-surface-cream"
                        : "border-border-subtle bg-surface-white"
                    }`}
                  >
                    <img
                      src={image}
                      alt=""
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src =
                          "/brand/logo/the-crown-anchor-logo-black.png";
                      }}
                      className="size-16 rounded-md bg-surface-cream object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm text-text-slate">{product.brand} · {product.category}</p>
            <h1 className="mt-2 text-3xl font-bold text-brand-navy">{product.title}</h1>
            <div className="mt-4">
              <ProductRating rating={product.rating} reviewCount={product.reviewCount ?? 0} />
            </div>
            <p className="mt-5 leading-7 text-text-slate">{product.description}</p>
            <p className="mt-6 text-2xl font-bold text-brand-navy">
              {formatPrice(getProductPrice(product, selectedBranch?.id))}
            </p>
          </div>
        </div>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_0.7fr]">
          <div>
            <h2 className="text-2xl font-bold text-brand-navy">Customer reviews</h2>
            <p className="mt-1 text-sm text-text-slate">{reviewsTotal} review{reviewsTotal === 1 ? "" : "s"}</p>
            <div className="mt-5 space-y-4">
              {reviews.length === 0 && (
                <p className="rounded-xl border border-border-subtle bg-surface-white p-6 text-sm text-text-slate">No reviews yet. Be the first to share your experience.</p>
              )}
              {reviewsQuery.error && (
                <p className="text-sm text-status-error" role="alert">
                  {normalizeError(reviewsQuery.error, "Unable to load reviews.").message}
                </p>
              )}
              {reviews.map((review) => (
                <article key={review.id} className="rounded-xl border border-border-subtle bg-surface-white p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-brand-navy">{review.userName}</p>
                      <ProductRating rating={review.rating} />
                    </div>
                    {user?.id === review.userId && (
                      <div className="flex gap-2">
                        <button type="button" onClick={() => startEditing(review)} aria-label="Edit your review" className="text-brand-navy hover:text-brand-gold"><Pencil size={17} /></button>
                        <button type="button" onClick={() => void handleDelete(review)} disabled={submitting} aria-label="Delete your review" className="text-status-error hover:opacity-70"><Trash2 size={17} /></button>
                      </div>
                    )}
                  </div>
                  {review.comment && (
                    <p className="mt-3 text-sm leading-6 text-text-slate">{review.comment}</p>
                  )}
                </article>
              ))}
              {hasMoreReviews && (
                <button
                  type="button"
                  onClick={() => void loadMoreReviews()}
                  disabled={loadingMore}
                  className="w-full rounded-xl border border-border-subtle bg-surface-white px-4 py-3 text-sm font-semibold text-brand-navy transition hover:bg-surface-cream disabled:opacity-60"
                >
                  {loadingMore ? "Loading..." : "Load more reviews"}
                </button>
              )}
            </div>
          </div>

          <div className="h-fit rounded-xl border border-border-subtle bg-surface-white p-6">
            <h2 className="text-xl font-bold text-brand-navy">
              {editingReview || myReview ? "Update your review" : "Write a review"}
            </h2>
            {!user ? (
              <p className="mt-3 text-sm text-text-slate">
                <Link to="/login" className="font-semibold text-brand-navy underline">Sign in</Link> to rate and review this product.
              </p>
            ) : (
              <form onSubmit={(event) => void handleSubmit(event)} className="mt-4 space-y-4">
                <label className="block text-sm font-medium text-brand-navy">
                  Rating
                  <select value={rating} onChange={(event) => setRating(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-border-subtle bg-white px-3">
                    {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} / 5 stars</option>)}
                  </select>
                </label>
                <label className="block text-sm font-medium text-brand-navy">
                  Comment
                  <textarea value={comment} onChange={(event) => setComment(event.target.value)} rows={5} maxLength={500} placeholder="Tell other shoppers about this product..." className="mt-2 w-full rounded-lg border border-border-subtle p-3 text-sm outline-none focus:border-brand-gold" />
                </label>
                {formError && <p className="text-sm text-status-error" role="alert">{formError}</p>}
                <div className="flex gap-3">
                  <button type="submit" disabled={submitting} className="rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                    {submitting ? "Saving…" : editingReview || myReview ? "Update review" : "Publish review"}
                  </button>
                  {editingReview && <button type="button" onClick={resetForm} className="rounded-lg border border-border-subtle px-4 py-2 text-sm font-semibold text-text-slate">Cancel</button>}
                </div>
              </form>
            )}
          </div>
        </section>
      </section>
    </div>
  );
}
