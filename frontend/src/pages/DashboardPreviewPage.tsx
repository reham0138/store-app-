import {
  AlertTriangle,
  CircleDollarSign,
  ClipboardList,
  Edit3,
  PackageSearch,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  DashboardCard,
  DashboardEmptyState,
  DashboardPageHeader,
  DashboardTable,
  ProductForm,
  StatCard,
} from "../shared/components/dashboard";
import type {
  DashboardTableColumn,
  ProductFormValues,
} from "../shared/components/dashboard";
import Button from "../shared/components/Button";
import { FormError } from "../shared/components/FormError";
import { Input } from "../shared/components/Input";
import { Label } from "../shared/components/Label";
import { Select } from "../shared/components/Select";
import type { StoreProduct } from "../shared/types/cart";
import { getProducts } from "../shared/services/product.service";
import { saveProducts } from "../shared/utils/productStorage";
import { getOrders } from "../shared/utils/orderStorage";
import { formatPrice } from "../shared/utils/pricing";
import type { Order } from "../shared/types/order";

type StockFilter = "all" | "in-stock" | "low-stock" | "out-of-stock";

const emptyForm: ProductFormValues = {
  title: "",
  brand: "",
  category: "",
  price: "",
  stock: "",
  discountPercentage: "0",
  description: "",
};

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

function toFormValues(product: StoreProduct): ProductFormValues {
  return {
    title: product.title,
    brand: product.brand,
    category: product.category,
    price: String(product.price),
    stock: String(product.stock),
    discountPercentage: String(product.discountPercentage),
    description: product.description,
  };
}

export default function DashboardPreviewPage() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [orders] = useState<Order[]>(getOrders);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        const loadedProducts = await getProducts();
        if (isMounted) setProducts(loadedProducts);
      } catch (error) {
        if (isMounted) {
          setLoadError(
            error instanceof Error ? error.message : "Failed to load products.",
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
      orderRevenue: orders
        .filter((order) => order.status !== "cancelled")
        .reduce((total, order) => total + order.total, 0),
      pendingOrders: orders.filter((order) => order.status === "pending").length,
    };
  }, [products, orders]);

  function openAddForm() {
    setEditingProductId(null);
    setActionMessage("");
    setActionError("");
    setIsFormOpen(true);
  }

  function openEditForm(product: StoreProduct) {
    setEditingProductId(product.id);
    setActionMessage("");
    setActionError("");
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
  }

  function handleProductSubmit(values: ProductFormValues) {
    setActionError("");
    const price = Number(values.price);
    const stock = Number(values.stock);
    const discountPercentage = Number(values.discountPercentage);
    const updatedProducts =
      editingProductId === null
        ? [
            {
              id: Math.max(0, ...products.map((product) => product.id)) + 1,
              title: values.title.trim(),
              description: values.description.trim(),
              category: values.category.trim(),
              price,
              discountPercentage,
              rating: 0,
              stock,
              brand: values.brand.trim(),
              thumbnail: "https://picsum.photos/seed/new-product/300/300",
              images: [],
            },
            ...products,
          ]
        : products.map((product) =>
            product.id === editingProductId
              ? {
                  ...product,
                  title: values.title.trim(),
                  description: values.description.trim(),
                  category: values.category.trim(),
                  price,
                  discountPercentage,
                  stock,
                  brand: values.brand.trim(),
                }
              : product,
          );

    try {
      saveProducts(updatedProducts);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to save product changes.",
      );
      return;
    }

    setProducts(updatedProducts);
    if (editingProductId === null) {
      setActionMessage("Product added successfully.");
    } else {
      setActionMessage("Product updated successfully.");
    }

    closeForm();
  }

  const productColumns: DashboardTableColumn<StoreProduct>[] = [
    {
      key: "product",
      header: "Product",
      render: (product) => (
        <div className="flex min-w-48 items-center gap-3">
          <img
            src={product.thumbnail}
            alt=""
            className="size-10 shrink-0 rounded-lg object-cover"
          />
          <div className="min-w-0">
            <p className="truncate font-medium text-brand-navy">
              {product.title}
            </p>
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
      render: (product) => `$${product.price.toFixed(2)}`,
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
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(status)}`}>
            {status}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      render: (product) => (
        <Button
          variant="tertiary"
          onClick={() => openEditForm(product)}
          className="inline-flex items-center gap-2 whitespace-nowrap"
        >
          <Edit3 aria-hidden="true" size={15} />
          Edit
        </Button>
      ),
    },
  ];

  return (
    <section className="mx-auto grid min-w-0 w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <DashboardPageHeader
        subTitle="Manager dashboard"
        title="Store overview"
        description="Manage catalog products and monitor store inventory."
        actions={
          <>
            <Link
              to="/dashboard/orders"
              className="inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-white px-4 py-2 text-sm font-medium text-brand-navy transition hover:bg-surface-cream"
            >
              <ClipboardList aria-hidden="true" size={16} />
              View orders
            </Link>
            <Button onClick={openAddForm} className="inline-flex items-center gap-2">
              <Plus aria-hidden="true" size={16} />
              Add product
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total products"
          value={String(stats.totalProducts)}
          description="Available in the catalog"
          icon={<PackageSearch size={20} />}
        />
        <StatCard
          label="Order revenue"
          value={formatPrice(stats.orderRevenue)}
          description="Excludes cancelled orders"
          icon={<CircleDollarSign size={20} />}
        />
        <StatCard
          label="Pending orders"
          value={String(stats.pendingOrders)}
          description="Need attention"
          icon={<ClipboardList size={20} />}
        />
        <StatCard
          label="Low stock products"
          value={String(stats.lowStock + stats.outOfStock)}
          description={`${stats.outOfStock} out of stock`}
          trendType="negative"
          icon={<AlertTriangle size={20} />}
        />
      </div>

      <DashboardCard
        title="Products"
        description="Search, filter, edit, or add products in the catalog."
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

        {!isLoading && loadError && <FormError message={loadError} />}

        {!isLoading && !loadError && filteredProducts.length > 0 && (
          <DashboardTable
            columns={productColumns}
            rows={filteredProducts}
            getRowKey={(product) => String(product.id)}
          />
        )}

        {!isLoading && !loadError && filteredProducts.length === 0 && (
          <DashboardEmptyState
            title="No products found"
            description="Try changing the search text or filters."
            icon={<PackageSearch size={22} />}
          />
        )}

        {actionMessage && (
          <p className="mt-4 text-sm text-status-success" role="status">
            {actionMessage}
          </p>
        )}
      </DashboardCard>

      {isFormOpen && (
        <div
          className="fixed inset-0 z-40 overflow-y-auto bg-brand-navy/40 p-4 sm:p-8"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeForm();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-form-title"
            className="mx-auto max-w-2xl rounded-2xl border border-border-subtle bg-surface-white p-5 shadow-xl sm:p-7"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-gold">
                  Product management
                </p>
                <h2
                  id="product-form-title"
                  className="mt-1 text-2xl font-semibold text-brand-navy"
                >
                  {editingProductId === null ? "Add product" : "Edit product"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeForm}
                aria-label="Close product form"
                className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-text-slate hover:bg-surface-cream hover:text-brand-navy"
              >
                <X aria-hidden="true" size={20} />
              </button>
            </div>

            {actionError && (
              <div className="mb-4">
                <FormError message={actionError} />
              </div>
            )}

            <ProductForm
              key={`${editingProductId === null ? "add" : "edit"}-${editingProductId ?? "new"}`}
              initialValues={
                editingProductId === null
                  ? emptyForm
                  : toFormValues(
                      products.find((product) => product.id === editingProductId) ??
                        products[0],
                    )
              }
              mode={editingProductId === null ? "add" : "edit"}
              onSubmit={handleProductSubmit}
              onCancel={closeForm}
            />
          </div>
        </div>
      )}
    </section>
  );
}