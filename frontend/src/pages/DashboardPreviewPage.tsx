import {
  ArrowRight,
  AlertTriangle,
  CircleDollarSign,
  ClipboardList,
  Edit3,
  PackageSearch,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import type { Order } from "../shared/types/order";
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "../shared/services/product.service";
import type { ProductInput } from "../shared/services/product.service";
import { getBranches } from "../shared/services/branches.service";
import type { Branch } from "../shared/types/type";
import { reportsService } from "../shared/services/reports.service";
import type { DashboardReport } from "../shared/services/reports.service";
import { formatPrice } from "../shared/utils/pricing";
import OrderStatus from "../shared/components/OrderStatus";
import { normalizeError } from "../shared/api/errors";

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

function toCatalogInput(values: ProductFormValues): ProductInput {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    category: values.category.trim(),
    brand: values.brand.trim(),
    price: Number(values.price),
    discountPercentage: Number(values.discountPercentage),
    thumbnail: "",
    images: [] as string[],
  };
}

export default function DashboardPreviewPage() {
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    try {
      const [reportData, productData, branchData] = await Promise.all([
        reportsService.admin(),
        getProducts(),
        getBranches(),
      ]);
      setReport(reportData);
      setProducts(productData);
      setBranches(branchData);
      setLoadError("");
    } catch (error) {
      setLoadError(normalizeError(error, "Failed to load dashboard data.").message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadAll());
  }, [loadAll]);

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
      orderRevenue: report?.totals.orderRevenue ?? 0,
      pendingOrders: report?.totals.pendingOrders ?? 0,
    };
  }, [products, report]);

  const recentOrders = report?.recentOrders ?? [];
  const stockAlerts = report?.stockAlerts ?? [];

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

  async function handleProductSubmit(values: ProductFormValues) {
    setActionError("");
    const catalog = toCatalogInput(values);

    try {
      if (editingProductId === null) {
        // Create sends catalog fields + initial per-branch stock. Stock/price
        // per branch afterwards go through /stock and /branch-price only.
        const initialStock = Number(values.stock);
        await createProduct({
          ...catalog,
          branchInventory: branches.map((branch) => ({
            branchId: branch.id,
            price: catalog.price,
            stock: Number.isInteger(initialStock) && initialStock >= 0 ? initialStock : 0,
          })),
        });
        setActionMessage("Product added successfully.");
      } else {
        // PATCH accepts catalog fields only — never stock/branchInventory.
        await updateProduct(editingProductId, {
          title: catalog.title,
          description: catalog.description,
          category: catalog.category,
          brand: catalog.brand,
          price: catalog.price,
          discountPercentage: catalog.discountPercentage,
        });
        setActionMessage("Product updated successfully.");
      }
      setProducts(await getProducts());
      closeForm();
      void loadAll();
    } catch (error) {
      setActionError(normalizeError(error, "Failed to save product changes.").message);
    }
  }

  async function handleDeleteProduct(product: StoreProduct) {
    if (!window.confirm(`Delete "${product.title}"? This cannot be undone.`)) {
      return;
    }
    setDeletingId(product.id);
    setActionError("");
    try {
      await deleteProduct(product.id);
      setProducts(await getProducts());
      setActionMessage(`"${product.title}" deleted.`);
      void loadAll();
    } catch (error) {
      setActionError(normalizeError(error, "Failed to delete product.").message);
    } finally {
      setDeletingId(null);
    }
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
        <div className="flex items-center gap-2">
          <Button
            variant="tertiary"
            onClick={() => openEditForm(product)}
            className="inline-flex items-center gap-2 whitespace-nowrap"
          >
            <Edit3 aria-hidden="true" size={15} />
            Edit
          </Button>
          <Button
            variant="tertiary"
            disabled={deletingId === product.id}
            onClick={() => void handleDeleteProduct(product)}
            className="inline-flex items-center gap-2 whitespace-nowrap text-status-error"
          >
            <Trash2 aria-hidden="true" size={15} />
            {deletingId === product.id ? "Deleting…" : "Delete"}
          </Button>
        </div>
      ),
    },
  ];

  const recentOrderColumns: DashboardTableColumn<Order>[] = [
    {
      key: "order",
      header: "Order",
      render: (order) => (
        <span className="font-medium text-brand-navy">{order.id}</span>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      render: (order) =>
        order.shippingAddress.fullName || "Unnamed customer",
    },
    {
      key: "date",
      header: "Date",
      render: (order) => new Date(order.createdAt).toLocaleDateString(),
    },
    {
      key: "total",
      header: "Total",
      render: (order) => formatPrice(order.total),
    },
    {
      key: "status",
      header: "Status",
      render: (order) => <OrderStatus status={order.status} />,
    },
  ];

  const stockAlertColumns: DashboardTableColumn<StoreProduct>[] = [
    {
      key: "product",
      header: "Product",
      render: (product) => (
        <div className="min-w-36">
          <p className="font-medium text-brand-navy">{product.title}</p>
          <p className="text-xs text-text-slate">{product.brand}</p>
        </div>
      ),
    },
    {
      key: "stock",
      header: "Units left",
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
        subTitle="Admin dashboard"
        title="Store overview"
        description="Manage catalog products and monitor store inventory."
        actions={
          <>
            <Link
              to="/dashboard/admin/orders"
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

      <div className="grid min-w-0 gap-8 xl:grid-cols-[1.4fr_1fr]">
        <DashboardCard
          title="Recent orders"
          description="The latest orders placed across your store."
          actions={
            <Link
              to="/dashboard/admin/orders"
              className="inline-flex items-center gap-2 text-sm font-medium text-brand-navy hover:text-brand-gold"
            >
              View all
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          }
        >
          {recentOrders.length > 0 ? (
            <DashboardTable
              columns={recentOrderColumns}
              rows={recentOrders}
              getRowKey={(order) => order.id}
            />
          ) : (
            <DashboardEmptyState
              title="No orders yet"
              description="Orders created during checkout will appear here."
              icon={<ClipboardList size={22} />}
            />
          )}
        </DashboardCard>

        <DashboardCard
          title="Stock alerts"
          description="Products with 10 or fewer units available."
          actions={
            <Link
              to="/dashboard/admin/inventory"
              className="inline-flex items-center gap-2 text-sm font-medium text-brand-navy hover:text-brand-gold"
            >
              Manage inventory
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          }
        >
          {isLoading ? (
            <p className="py-8 text-center text-sm text-text-slate">
              Loading inventory...
            </p>
          ) : loadError ? (
            <FormError message={loadError} />
          ) : stockAlerts.length > 0 ? (
            <DashboardTable
              columns={stockAlertColumns}
              rows={stockAlerts}
              getRowKey={(product) => product.id}
            />
          ) : (
            <DashboardEmptyState
              title="Stock levels look good"
              description="Products with low or empty stock will appear here."
              icon={<PackageSearch size={22} />}
            />
          )}
        </DashboardCard>
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
            getRowKey={(product) => product.id}
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
              onSubmit={(values) => void handleProductSubmit(values)}
              onCancel={closeForm}
            />
          </div>
        </div>
      )}
    </section>
  );
}
