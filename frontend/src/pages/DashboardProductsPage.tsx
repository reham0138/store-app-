import {
  AlertTriangle,
  PackageSearch,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  DashboardCard,
  DashboardEmptyState,
  DashboardPageHeader,
  DashboardTable,
  StatCard,
} from "../shared/components/dashboard";
import type { DashboardTableColumn } from "../shared/components/dashboard";
import { Input } from "../shared/components/Input";
import { Label } from "../shared/components/Label";
import { Select } from "../shared/components/Select";
import type { StoreProduct } from "../shared/types/cart";
import { getProducts } from "../shared/services/product.service";
import { formatPrice } from "../shared/utils/pricing";

type StockFilter = "all" | "in-stock" | "low-stock" | "out-of-stock";

function getStockStatus(stock: number): "In stock" | "Low stock" | "Out of stock" {
  if (stock <= 0) return "Out of stock";
  if (stock <= 10) return "Low stock";
  return "In stock";
}

function getStatusClass(status: ReturnType<typeof getStockStatus>): string {
  if (status === "In stock") return "bg-status-success/10 text-status-success";
  if (status === "Low stock") return "bg-status-warning/10 text-status-warning";
  return "bg-status-error/10 text-status-error";
}

export default function DashboardProductsPage() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        const loadedProducts = await getProducts();
        if (isMounted) setProducts(loadedProducts);
      } catch (loadError) {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Failed to load products.",
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category))].sort(),
    [products],
  );

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        [product.title, product.brand, product.category].some((value) =>
          value.toLowerCase().includes(normalizedSearch),
        );

      const matchesCategory =
        !selectedCategory || product.category === selectedCategory;

      const status = getStockStatus(product.stock);
      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "in-stock" && status === "In stock") ||
        (stockFilter === "low-stock" && status === "Low stock") ||
        (stockFilter === "out-of-stock" && status === "Out of stock");

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, search, selectedCategory, stockFilter]);

  const stats = useMemo(() => {
    const lowStock = products.filter(
      (product) => getStockStatus(product.stock) === "Low stock",
    ).length;

    const outOfStock = products.filter((product) => product.stock <= 0).length;

    return {
      totalProducts: products.length,
      lowStock,
      outOfStock,
    };
  }, [products]);

  const productColumns: DashboardTableColumn<StoreProduct>[] = [
    {
      key: "product",
      header: "Product",
      render: (product) => (
        <div className="flex min-w-48 items-center gap-3">
          <img
            src={product.thumbnail}
            alt=""
            loading="lazy"
            width={40}
            height={40}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = "/brand/logo/the-crown-anchor-logo-black.png";
            }}
            className="size-10 shrink-0 rounded-lg object-cover"
          />
          <div className="min-w-0">
            <p className="truncate font-medium text-brand-navy">{product.title}</p>
            <p className="truncate text-xs text-text-slate">{product.brand}</p>
          </div>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      render: (product) => product.category,
    },
    {
      key: "price",
      header: "Price",
      render: (product) => formatPrice(product.price),
    },
    {
      key: "stock",
      header: "Stock",
      render: (product) => product.stock,
    },
    {
      key: "status",
      header: "Status",
      render: (product) => {
        const status = getStockStatus(product.stock);
        return (
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(status)}`}
          >
            {status}
          </span>
        );
      },
    },
  ];

  return (
    <section className="mx-auto grid min-w-0 w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <DashboardPageHeader
        subTitle="Manager dashboard"
        title="Products"
        description="Monitor the catalog, search inventory, and review product availability."
        actions={
          <Link
            to="/dashboard/admin"
            className="inline-flex items-center rounded-lg border border-border-subtle bg-surface-white px-4 py-2 text-sm font-medium text-brand-navy transition hover:bg-surface-cream"
          >
            Back to overview
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Total products"
          value={String(stats.totalProducts)}
          description="Catalog items"
          icon={<PackageSearch size={20} />}
        />
        <StatCard
          label="Low stock"
          value={String(stats.lowStock)}
          description="Needs attention"
          icon={<AlertTriangle size={20} />}
        />
        <StatCard
          label="Out of stock"
          value={String(stats.outOfStock)}
          description="Unavailable"
          icon={<AlertTriangle size={20} />}
          trendType="negative"
        />
      </div>

      <DashboardCard
        title="Catalog inventory"
        description="Search and filter products across the store catalog."
      >
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <Label label="Search products">
            <div className="relative">
              <Input
                type="search"
                value={search}
                placeholder="Search by name, brand, or category"
                onChange={(event) => setSearch(event.target.value)}
                className="pe-10"
              />
              <Search
                aria-hidden="true"
                size={18}
                className="pointer-events-none absolute inset-y-0 end-3 my-auto text-text-slate"
              />
            </div>
          </Label>

          <Label label="Category">
            <Select
              value={selectedCategory}
              options={categories.map((category) => ({
                value: category,
                label: category,
              }))}
              placeholder="All categories"
              onChange={(event) => setSelectedCategory(event.target.value)}
            />
          </Label>

          <Label label="Stock status">
            <Select
              value={stockFilter}
              options={[
                { value: "all", label: "All stock statuses" },
                { value: "in-stock", label: "In stock" },
                { value: "low-stock", label: "Low stock" },
                { value: "out-of-stock", label: "Out of stock" },
              ]}
              onChange={(event) =>
                setStockFilter(event.target.value as StockFilter)
              }
            />
          </Label>
        </div>

        {isLoading && (
          <p className="py-12 text-center text-sm text-text-slate">
            Loading products...
          </p>
        )}

        {!isLoading && error && (
          <p className="py-8 text-center text-sm text-status-error">{error}</p>
        )}

        {!isLoading && !error && filteredProducts.length > 0 && (
          <DashboardTable
            columns={productColumns}
            rows={filteredProducts}
            getRowKey={(product) => String(product.id)}
          />
        )}

        {!isLoading && !error && filteredProducts.length === 0 && (
          <DashboardEmptyState
            title="No products found"
            description="Try changing the search text or stock filters."
            icon={<PackageSearch size={22} />}
          />
        )}
      </DashboardCard>
    </section>
  );
}