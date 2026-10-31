
import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

import { getProducts } from "../shared/services/product.service";
import type { StoreProduct } from "../shared/types/cart";
import ProductCard from "../shared/components/ProductCard";

type SortOption = "default" | "price-low" | "price-high" | "rating";

export default function ProductsPage() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("default");

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const data = await getProducts();

        if (isMounted) {
          setProducts(data);
        }
      } catch {
        if (isMounted) {
          setError("We couldn't load the products. Please try again.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category))],
    [products],
  );

  const filteredProducts = useMemo(() => {
    let result = products.filter((product) => {
      const term = search.toLowerCase().trim();

      const matchesSearch =
        product.title.toLowerCase().includes(term) ||
        product.brand.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term);

      const matchesCategory =
        selectedCategory === "all" ||
        product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });

    switch (sortBy) {
      case "price-low":
        result = [...result].sort(
          (a, b) =>
            a.price * (1 - a.discountPercentage / 100) -
            b.price * (1 - b.discountPercentage / 100),
        );
        break;

      case "price-high":
        result = [...result].sort(
          (a, b) =>
            b.price * (1 - b.discountPercentage / 100) -
            a.price * (1 - a.discountPercentage / 100),
        );
        break;

      case "rating":
        result = [...result].sort((a, b) => b.rating - a.rating);
        break;

      default:
        break;
    }

    return result;
  }, [products, search, selectedCategory, sortBy]);

  return (
    <main className="min-h-screen bg-surface-cream">
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
              {loading
                ? "Loading products..."
                : `${filteredProducts.length} products found`}
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
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by product name or brand..."
              className="h-11 w-full rounded-xl border border-border-subtle bg-white pl-10 pr-4 text-sm outline-none transition focus:border-brand-gold"
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
                setSortBy(event.target.value as SortOption)
              }
              aria-label="Sort products"
              className="h-11 w-full appearance-none rounded-xl border border-border-subtle bg-white pl-9 pr-4 text-sm outline-none focus:border-brand-gold"
            >
              <option value="default">Sort: Default</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Categories */}
        {!loading && !error && (
          <div className="mb-8 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                selectedCategory === "all"
                  ? "bg-brand-navy text-white"
                  : "border border-border-subtle bg-white text-text-slate hover:border-brand-navy"
              }`}
            >
              All
            </button>

            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
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
        {loading && (
          <p className="py-16 text-center text-sm text-text-slate">
            Loading products...
          </p>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="rounded-xl border border-status-error/20 bg-white px-6 py-12 text-center">
            <p className="font-medium text-status-error">{error}</p>

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
        {!loading && !error && filteredProducts.length === 0 && (
          <div className="rounded-xl border border-border-subtle bg-white px-6 py-16 text-center">
            <h3 className="font-semibold text-brand-navy">
              No products found
            </h3>

            <p className="mt-2 text-sm text-text-slate">
              Try another search term or category.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedCategory("all");
              }}
              className="mt-4 text-sm font-semibold text-brand-navy underline"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Product Cards */}
{!loading && !error && filteredProducts.length > 0 && (
  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {filteredProducts.map((product) => (
      <ProductCard key={product.id} product={product} />
    ))}
  </div>
)}
      
      </section>
    </main>
  );
}
