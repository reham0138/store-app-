import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  MapPin,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
} from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "../shared/components/ProductCard";
import { useBranch } from "../shared/contexts/useBranch";
import { normalizeError } from "../shared/api/errors";
import {
  useCategoriesQuery,
  useProductListQuery,
} from "../shared/hooks/useApiQueries";

export default function HomePage() {
  const categoriesQuery = useCategoriesQuery();
  const {
    selectedBranch,
    isLoading: branchesLoading,
    error: branchError,
  } = useBranch();
  const branchId = selectedBranch?.id;
  const productsQuery = useProductListQuery(
    { branchId, stockStatus: "in", page: 1, limit: 4 },
    Boolean(branchId) && !branchesLoading,
  );
  const categories = categoriesQuery.data ?? [];
  const products = productsQuery.data?.items ?? [];
  const productsError = productsQuery.error
    ? normalizeError(
        productsQuery.error,
        "We couldn't load products for this branch.",
      ).message
    : null;

  return (
    <div>
      <section className="relative isolate flex min-h-[min(760px,calc(100svh-4rem))] overflow-hidden bg-brand-navy text-white">
        <video
          className="absolute inset-0 -z-20 size-full object-cover motion-reduce:hidden"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-hidden="true"
          tabIndex={-1}
        >
          <source src="/bacground.mp4" type="video/mp4" />
        </video>
        <div
          className="absolute inset-0 -z-10 bg-brand-navy/75"
          aria-hidden="true"
        />

        <div className="mx-auto flex w-full max-w-7xl flex-col justify-center px-5 py-20 sm:px-8 lg:px-12">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold backdrop-blur-md">
              <Sparkles aria-hidden="true" size={15} />
              A little better, every day
            </p>
            <h1 className="mt-7 max-w-3xl text-5xl font-semibold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">
              Find your
              <span className="block font-serif italic text-brand-gold">
                everyday
              </span>
              favorite.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-white/80 sm:text-lg">
              Thoughtful clothes, bags, and shoes for wherever the day takes
              you. Find something you love, then make it yours.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/products"
                className="inline-flex items-center gap-3 rounded-full bg-brand-gold px-6 py-3.5 font-semibold text-brand-navy hover:bg-[#e2c36c]"
              >
                Explore the collection
                <ArrowRight aria-hidden="true" size={18} />
              </Link>
              <Link
                to="/branches"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/5 px-5 py-3.5 text-sm font-medium text-white hover:bg-white/15"
              >
                {selectedBranch
                  ? `Shopping from ${selectedBranch.name}`
                  : "Choose your branch"}
                <ArrowUpRight aria-hidden="true" size={16} />
              </Link>
            </div>
          </div>

          <div className="mt-auto flex items-end justify-between gap-6 pt-16">
            <div className="hidden items-center gap-3 text-xs text-white/65 sm:flex">
              <span className="h-px w-10 bg-brand-gold/80" />
              Made for the everyday
            </div>
            <a
              href="#browse-categories"
              className="ms-auto inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/75 hover:text-brand-gold"
            >
              Find your kind of thing
              <ArrowDown aria-hidden="true" size={15} />
            </a>
          </div>
        </div>
      </section>

      <section
        id="browse-categories"
        className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12"
      >
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold">
              Start somewhere good
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-brand-navy sm:text-4xl">
              Browse by category
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-text-slate sm:text-base">
              Find your next favorite, one collection at a time.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-navy hover:text-brand-gold"
          >
            View everything
            <ArrowRight aria-hidden="true" size={16} />
          </Link>
        </div>

        {categoriesQuery.isLoading ? (
          <div
            className="grid gap-4 sm:grid-cols-3"
            aria-label="Loading categories"
          >
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-48 animate-pulse rounded-2xl bg-surface-cream"
              />
            ))}
          </div>
        ) : categoriesQuery.error ? (
          <div
            className="rounded-2xl border border-status-error/20 bg-surface-white p-8 text-center"
            role="alert"
          >
            <p className="text-sm text-status-error">
              {normalizeError(
                categoriesQuery.error,
                "We couldn't load product categories.",
              ).message}
            </p>
            <button
              type="button"
              onClick={() => void categoriesQuery.refetch()}
              className="mt-4 rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </div>
        ) : categories.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${encodeURIComponent(category.id)}`}
                className="relative flex min-h-48 flex-col justify-between overflow-hidden rounded-2xl border border-border-subtle bg-surface-white p-6 transition-colors hover:border-brand-gold"
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-brand-navy text-brand-gold">
                  <ShoppingBag aria-hidden="true" size={20} />
                </span>
                <span className="flex items-end justify-between gap-4">
                  <span>
                    <span className="block text-2xl font-semibold capitalize text-brand-navy">
                      {category.name}
                    </span>
                    <span className="mt-1 block text-sm text-text-slate">
                      Explore the collection
                    </span>
                  </span>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border-subtle text-brand-navy">
                    <ArrowUpRight aria-hidden="true" size={18} />
                  </span>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border-subtle bg-surface-white p-8 text-center">
            <p className="text-text-slate">
              Browse the full collection and find something for your everyday.
            </p>
            <Link
              to="/products"
              className="mt-4 inline-flex items-center gap-2 font-semibold text-brand-navy hover:text-brand-gold"
            >
              Browse products
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
        )}
      </section>

      <section className="bg-surface-cream">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 sm:px-8 md:grid-cols-[1fr_auto] md:items-center lg:px-12">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold">
              The seasonal edit
            </p>
            <h2 className="mt-2 max-w-2xl text-3xl font-semibold text-brand-navy sm:text-4xl">
              A fresh edit for right now.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-text-slate sm:text-base">
              Take a moment to explore the collection and find something that
              feels like you.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-brand-navy px-6 py-3.5 font-semibold text-white hover:bg-brand-navy/90"
          >
            Discover the collection
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>
      </section>

      <section
        aria-labelledby="branch-products-heading"
        className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12"
      >
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold">
              Shop local
            </p>
            <h2
              id="branch-products-heading"
              className="mt-2 text-3xl font-semibold text-brand-navy sm:text-4xl"
            >
              {selectedBranch
                ? `Available at ${selectedBranch.name}`
                : "Find what's available near you"}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-text-slate sm:text-base">
              {selectedBranch
                ? `Product prices and stock are shown for ${selectedBranch.name}.`
                : "Choose a branch to see local stock and pricing."}
            </p>
            {selectedBranch &&
              (selectedBranch.address || selectedBranch.operationalStatus) && (
                <p className="mt-2 text-sm text-text-slate">
                  {selectedBranch.address}
                  {selectedBranch.address && selectedBranch.operationalStatus
                    ? " · "
                    : ""}
                  {selectedBranch.operationalStatus
                    ? `Listed as ${selectedBranch.operationalStatus}`
                    : ""}
                </p>
              )}
          </div>
          <Link
            to="/branches"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-navy hover:text-brand-gold"
          >
            <MapPin aria-hidden="true" size={17} />
            {selectedBranch ? "Change branch" : "Choose a branch"}
          </Link>
        </div>

        {branchError && (
          <p
            className="mb-5 rounded-xl border border-status-error/20 bg-surface-white p-4 text-sm text-status-error"
            role="alert"
          >
            {branchError}
          </p>
        )}

        {branchesLoading || productsQuery.isLoading ? (
          <div
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
            aria-label="Loading products"
          >
            {[0, 1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-80 animate-pulse rounded-xl bg-surface-cream"
              />
            ))}
          </div>
        ) : !selectedBranch ? (
          <div className="rounded-2xl border border-border-subtle bg-surface-white p-8 text-center">
            <p className="text-text-slate">
              Choose a branch to see local stock and pricing.
            </p>
            <Link
              to="/branches"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-navy px-5 py-3 font-semibold text-white"
            >
              Select a branch
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
        ) : productsError ? (
          <div
            className="rounded-2xl border border-status-error/20 bg-surface-white p-8 text-center"
            role="alert"
          >
            <p className="text-sm text-status-error">{productsError}</p>
            <button
              type="button"
              onClick={() => void productsQuery.refetch()}
              className="mt-4 rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white"
            >
              Try again
            </button>
          </div>
        ) : products.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-border-subtle bg-surface-white p-8 text-center">
            <p className="text-text-slate">
              There are no in-stock products at {selectedBranch.name} right now.
            </p>
            <Link
              to="/branches"
              className="mt-4 inline-flex items-center gap-2 font-semibold text-brand-navy hover:text-brand-gold"
            >
              Check another branch
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
        )}
      </section>

      <section className="border-y border-border-subtle bg-surface-white">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-12">
          <div className="mb-8 max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold">
              Shop with confidence
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-brand-navy">
              Helpful details, at every step.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Link
              to="/branches"
              className="rounded-2xl border border-border-subtle p-6 transition-colors hover:border-brand-gold"
            >
              <MapPin aria-hidden="true" className="text-brand-gold" size={24} />
              <h3 className="mt-4 font-semibold text-brand-navy">
                Shop your branch
              </h3>
              <p className="mt-2 text-sm leading-6 text-text-slate">
                See prices and available stock for the branch you choose.
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-navy">
                Choose a branch
                <ArrowRight
                  aria-hidden="true"
                  size={15}
                />
              </span>
            </Link>
            <Link
              to="/products"
              className="rounded-2xl border border-border-subtle p-6 transition-colors hover:border-brand-gold"
            >
              <Star aria-hidden="true" className="text-brand-gold" size={24} />
              <h3 className="mt-4 font-semibold text-brand-navy">
                Explore product details
              </h3>
              <p className="mt-2 text-sm leading-6 text-text-slate">
                Review product descriptions, images, and ratings before you
                decide.
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-navy">
                Browse products
                <ArrowRight
                  aria-hidden="true"
                  size={15}
                />
              </span>
            </Link>
            <Link
              to="/cart"
              className="rounded-2xl border border-border-subtle p-6 transition-colors hover:border-brand-gold"
            >
              <ShoppingCart
                aria-hidden="true"
                className="text-brand-gold"
                size={24}
              />
              <h3 className="mt-4 font-semibold text-brand-navy">
                Review your cart
              </h3>
              <p className="mt-2 text-sm leading-6 text-text-slate">
                Check your selections in one place before continuing to
                checkout.
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-navy">
                Go to cart
                <ArrowRight
                  aria-hidden="true"
                  size={15}
                />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
