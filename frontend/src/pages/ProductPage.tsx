import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal } from "lucide-react";

import { listProducts } from "../shared/services/product.service";
import type { ProductSort } from "../shared/services/product.service";
import type { StoreProduct } from "../shared/types/cart";
import ProductCard from "../shared/components/ProductCard";
import { useBranch } from "../shared/contexts/useBranch";
import { normalizeError } from "../shared/api/errors";

const PAGE_SIZE = 12;
const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "default", label: "Sort: Default" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
];

export default function ProductsPage() {
  const {
    selectedBranch,
    isLoading: branchesLoading,
    error: branchError,
  } = useBranch();
  const branchId = selectedBranch?.id;

  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const selectedCategory = searchParams.get("category") ?? "all";
  const sortBy = (searchParams.get("sort") ?? "default") as ProductSort;
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  const [searchInput, setSearchInput] = useState(search);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const pageLoading = loading || branchesLoading;
  const pageError =
    branchError ??
    (!branchesLoading && !selectedBranch
      ? "No branches are currently available."
      : error);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Debounce the search box into the URL query string.
  useEffect(() => {
    const term = searchInput.trim();
    if (term === search) return;
    const timeoutId = window.setTimeout(() => {
      updateParams({ search: term || null, page: null });
    }, 400);
    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // Keep the input in sync when the URL changes externally (e.g. back button).
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  function updateParams(updates: Record<string, string | null>) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "" || value === "all" || value === "default") {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      }
      if (!updates.page) next.delete("page");
      return next;
    });
  }

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      setLoading(true);
      try {
        const data = await listProducts({
          search: search || undefined,
          category: selectedCategory === "all" ? undefined : selectedCategory,
          branchId,
          sort: sortBy,
          page,
          limit: PAGE_SIZE,
        });
        if (isMounted) {
          setProducts(data.items);
          setTotal(data.total);
          setError("");
        }
      } catch (loadError) {
        if (isMounted) {
          setError(
            normalizeError(loadError, "We couldn't load the products. Please try again.").message,
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    queueMicrotask(() => void loadProducts());
    return () => {
      isMounted = false;
    };
  }, [search, selectedCategory, sortBy, page, branchId]);

  // Category chips need the full catalog's categories; fetch once (contract max limit).
  useEffect(() => {
    let isMounted = true;
    listProducts({ limit: 100 })
      .then((data) => {
        if (isMounted) {
          setAllCategories(
            [...new Set(data.items.map((p) => p.category))].sort(),
          );
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set(allCategories);
    if (selectedCategory !== "all") set.add(selectedCategory);
    return [...set].sort();
  }, [allCategories, selectedCategory]);

  return (
    <div className="min-h-screen bg-page">
      {/* Page Header */}
      <section className="bg-brand-navy px-4 py-14 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
            The Crown & Anchor
          </p>

          <h1 className="text-3xl font-bold sm:text-4xl">
            Explore Our Products
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-white/75 sm:text-base">
            Discover quality products selected for your everyday needs.
          </p>
        </div>
      </section>

      {/* Products Section */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold text-brand-navy">
              All Products
            </h2>

            <p className="mt-1 text-sm text-text-slate">
              {pageLoading
                ? "Loading products..."
                : `${total} products found`}
            </p>
          </div>
        </div>

        {/* Search and Sort */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-slate"
            />

            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search products..."
              className="h-11 w-full rounded-xl border border-border-subtle bg-surface-white pl-10 pr-4 text-sm outline-none transition focus:border-brand-gold"
            />
          </div>

          <div className="relative sm:w-56">
            <SlidersHorizontal
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-slate"
            />

            <select
              value={sortBy}
              onChange={(event) =>
                updateParams({ sort: event.target.value, page: null })
              }
              aria-label="Sort products"
              className="h-11 w-full appearance-none rounded-xl border border-border-subtle bg-surface-white pl-9 pr-4 text-sm outline-none focus:border-brand-gold"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Categories */}
        {!pageLoading && !pageError && categories.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => updateParams({ category: null, page: null })}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                selectedCategory === "all"
                  ? "bg-brand-navy text-white"
                  : "border border-border-subtle bg-surface-white text-text-slate hover:border-brand-navy"
              }`}
            >
              All
            </button>

            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => updateParams({ category, page: null })}
                className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition ${
                  selectedCategory === category
                    ? "bg-brand-navy text-white"
                    : "border border-border-subtle bg-white text-text-slate hover:border-brand-navy"
                }`}
              >
                {category.replaceAll("-", " ")}
              </button>
            ))}
          </div>
        )}

        {/* Loading State */}
        {pageLoading && (
          <p className="py-16 text-center text-sm text-text-slate">
            Loading products and branch inventory...
          </p>
        )}

        {/* Error State */}
        {!pageLoading && pageError && (
          <div className="rounded-xl border border-status-error/20 bg-surface-white px-6 py-12 text-center">
            <p className="font-medium text-status-error">{pageError}</p>

            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-lg bg-brand-navy px-5 py-2 text-sm text-white"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!pageLoading && !pageError && products.length === 0 && (
          <div className="rounded-xl border border-border-subtle bg-surface-white px-6 py-16 text-center">
            <h3 className="font-semibold text-brand-navy">
              No products found
            </h3>

            <p className="mt-2 text-sm text-text-slate">
              Try another search term or category.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearchInput("");
                updateParams({ search: null, category: null, sort: null, page: null });
              }}
              className="mt-4 text-sm font-semibold text-brand-navy underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Product Cards */}
        {!pageLoading && !pageError && products.length > 0 && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!pageLoading && !pageError && totalPages > 1 && (
          <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Product pages">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => updateParams({ page: String(page - 1) })}
              className="rounded-lg border border-border-subtle bg-surface-white px-4 py-2 text-sm font-medium text-brand-navy disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-text-slate">
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => updateParams({ page: String(page + 1) })}
              className="rounded-lg border border-border-subtle bg-surface-white px-4 py-2 text-sm font-medium text-brand-navy disabled:opacity-50"
            >
              Next
            </button>
          </nav>
        )}
      </section>
    </div>
  );
}
