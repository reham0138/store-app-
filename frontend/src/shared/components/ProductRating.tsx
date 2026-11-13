import { Star } from "lucide-react";

interface ProductRatingProps {
  rating: number;
  reviewCount?: number;
}

export default function ProductRating({
  rating,
  reviewCount,
}: ProductRatingProps) {
  return (
    <span className="inline-flex items-center gap-1 text-sm text-brand-navy">
      <span className="inline-flex text-brand-gold" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={15}
            fill={star <= Math.round(rating) ? "currentColor" : "none"}
            aria-hidden="true"
          />
        ))}
      </span>
      <span className="font-semibold">{rating.toFixed(1)}/5</span>
      {reviewCount !== undefined && (
        <span className="text-text-slate">({reviewCount})</span>
      )}
    </span>
  );
}
