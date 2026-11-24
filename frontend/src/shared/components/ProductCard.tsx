import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import type { StoreProduct } from "../types/cart";
import { useCart } from "../hooks/useCart";
import { useBranch } from "../contexts/useBranch";
import {
  formatPrice,
  getProductPrice,
  getProductRegularPrice,
  getProductStock,
} from "../utils/pricing";
import ProductRating from "./ProductRating";

interface ProductCardProps {
  product: StoreProduct;
}

function ProductCard({ product }: ProductCardProps) {
  const { selectedBranch } = useBranch();
  const branchId = selectedBranch?.id;
  const { addToCart, items } = useCart();
  const stock = getProductStock(product, branchId);
  const quantityInCart =
    items.find((item) => item.product.id === product.id)?.quantity ?? 0;
  const hasReachedStockLimit = quantityInCart >= stock;
  const reviewCount = product.reviewCount ?? 0;
  const [isAdded, setIsAdded] = useState(false);
  const price = getProductPrice(product, branchId);
  const regularPrice = getProductRegularPrice(product, branchId);
  const hasDiscount = product.discountPercentage > 0;
  const addButtonLabel =
    stock <= 0
      ? "Out of stock"
      : hasReachedStockLimit
        ? "Maximum quantity reached"
        : isAdded
          ? "Added to cart"
          : "Add to cart";
  const stockLabel =
    stock <= 0
      ? `Out of stock${selectedBranch ? ` at ${selectedBranch.name}` : ""}`
      : `${stock} available${selectedBranch ? ` at ${selectedBranch.name}` : ""}`;

  const handleAddToCart = () => {
    if (hasReachedStockLimit) return;

    addToCart(product);
    setIsAdded(true);

    window.setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border-subtle bg-surface-white">
      <Link
        to={`/products/${product.id}`}
        className="rounded-t-xl focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-brand-gold"
      >
        <div className="relative h-52 overflow-hidden bg-surface-cream">
          <img
            src={product.thumbnail}
            alt={product.title}
            loading="lazy"
            width={320}
            height={160}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src =
                "/brand/logo/the-crown-anchor-logo-black.png";
            }}
            className="h-full w-full object-cover"
          />
          {hasDiscount && (
            <span className="absolute left-3 top-3 rounded-full bg-brand-gold px-3 py-1 text-xs font-semibold text-brand-navy">
              Save {Math.round(product.discountPercentage)}%
            </span>
          )}
        </div>

        <div className="p-4 pb-0">
          <div className="flex items-center justify-between gap-3">
            {product.brand && (
              <span className="truncate text-xs font-semibold uppercase tracking-wide text-text-slate">
                {product.brand}
              </span>
            )}
            <span className="ms-auto rounded-full bg-surface-cream px-2.5 py-1 text-xs capitalize text-text-slate">
              {product.category.replaceAll("-", " ")}
            </span>
          </div>

          <h3 className="mt-3 line-clamp-2 min-h-12 text-left text-base font-semibold leading-6 text-brand-navy">
            {product.title}
          </h3>

          <div className="mt-2 min-h-5">
            {reviewCount > 0 || product.rating > 0 ? (
              <ProductRating rating={product.rating} reviewCount={reviewCount} />
            ) : (
              <span className="text-xs text-text-slate">No reviews yet</span>
            )}
          </div>

          <div className="mt-4 flex min-h-7 items-baseline gap-2">
            <span className="text-lg font-bold text-brand-navy">
              {formatPrice(price)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-text-slate line-through">
                {formatPrice(regularPrice)}
              </span>
            )}
          </div>

          <p
            className={`mt-2 min-h-5 text-xs ${
              stock <= 0 ? "text-status-error" : "text-text-slate"
            }`}
            role="status"
          >
            {stockLabel}
          </p>
        </div>
      </Link>

      <div className="mt-auto p-4 pt-3">
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={hasReachedStockLimit}
          className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white ${
            hasReachedStockLimit
              ? "cursor-not-allowed bg-text-slate"
              : isAdded
                ? "bg-status-success"
                : "bg-brand-navy hover:bg-brand-navy/90"
          }`}
        >
          <ShoppingBag aria-hidden="true" size={17} />
          {addButtonLabel}
        </button>
      </div>
    </article>
  );
}

export default ProductCard;
