import {
  AlertTriangle,
  Boxes,
  Check,
  PackageSearch,
  Pencil,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  DashboardCard,
  DashboardEmptyState,
  DashboardPageHeader,
  DashboardTable,
  StatCard,
} from "../shared/components/dashboard";
import type { DashboardTableColumn } from "../shared/components/dashboard";
import { useBranch } from "../shared/contexts/useBranch";
import type { StoreProduct } from "../shared/types/cart";
import { formatPrice } from "../shared/utils/pricing";
import { useAuth } from "../shared/hooks/useAuth";
import Button from "../shared/components/Button";
import { FormError } from "../shared/components/FormError";
import { Input } from "../shared/components/Input";
import { Select } from "../shared/components/Select";
import { Label } from "../shared/components/Label";
import {
  listProducts,
  updateProductStock,
} from "../shared/services/product.service";
import type { StockStatusFilter } from "../shared/services/product.service";
import { normalizeError } from "../shared/api/errors";

const PAGE_SIZE = 20;
const LOW_STOCK_THRESHOLD = 5;

interface DashboardInventoryPageProps {
  branchScoped?: boolean;
}

interface InventoryRow {
  product: StoreProduct;
  totalStock: number;
  branchStock: number;
  status: "In stock" | "Low stock" | "Out of stock";
}

function stockStatusOf(stock: number): InventoryRow["status"] {
  if (stock <= 0) return "Out of stock";
  if (stock <= LOW_STOCK_THRESHOLD) return "Low stock";
  return "In stock";
}

export default function DashboardInventoryPage({
  branchScoped = false,
}: DashboardInventoryPageProps) {
  const { branches, selectedBranch } = useBranch();
  const { user } = useAuth();
  const managerBranchId = branchScoped ? user?.branchId : undefined;
  const [chosenBranchId, setChosenBranchId] = useState("");
  const adminBranchId = chosenBranchId || selectedBranch?.id || "";
  const branchId = branchScoped ? managerBranchId : adminBranchId || undefined;
  const inventoryBranch = branches.find((branch) => branch.id === branchId);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [category, setCategory] = useState("");
  const [stockStatus, setStockStatus] = useState<"" | StockStatusFilter>("");
  const [page, setPage] = useState(1);

  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [totals, setTotals] = useState({ all: 0, low: 0, out: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [stockDraft, setStockDraft] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  // Debounce search; any filter change resets to page 1.
  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const resetPageOnFilter = (apply: () => void) => {
    apply();
    setPage(1);
  };

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    if (branchScoped && !managerBranchId) {
      setProducts([]);
      setTotal(0);
      setIsLoading(false);
      return;
    }
    try {
      const [list, all, low, out] = await Promise.all([
        listProducts({
          branchId,
          search: debouncedSearch || undefined,
          category: category || undefined,
          stockStatus: stockStatus || undefined,
          page,
          limit: PAGE_SIZE,
        }),
        branchId
          ? listProducts({ branchId, page: 1, limit: 1 })
          : Promise.resolve({ total: 0 }),
        branchId
          ? listProducts({ branchId, stockStatus: "low", page: 1, limit: 1 })
          : Promise.resolve({ total: 0 }),
        branchId
          ? listProducts({ branchId, stockStatus: "out", page: 1, limit: 1 })
          : Promise.resolve({ total: 0 }),
      ]);
      setProducts(list.items);
      setTotal(list.total);
      setTotals({ all: all.total, low: low.total, out: out.total });
      setError("");
    } catch (loadError) {
      setError(normalizeError(loadError, "Failed to load inventory.").message);
    } finally {
      setIsLoading(false);
    }
  }, [branchId, managerBranchId, branchScoped, debouncedSearch, category, stockStatus, page]);

  useEffect(() => {
    queueMicrotask(() => void loadProducts());
  }, [loadProducts]);

  const rows = useMemo<InventoryRow[]>(() => {
    return products.map((product) => {
      // With ?branchId= the API/mock already reflects that branch's stock on product.stock.
      const branchStock = product.stock;
      const totalStock = product.branchInventory?.reduce(
        (sum, item) => sum + item.stock,
        0,
      ) ?? product.stock;

      return {
        product,
        totalStock: branchScoped ? branchStock : totalStock,
        branchStock,
        status: stockStatusOf(branchStock),
      };
    });
  }, [products, branchScoped]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    if (category) set.add(category);
    return [...set].sort();
  }, [products, category]);

  function startEditing(row: InventoryRow) {
    if (!branchId) {
      setActionError("Select a branch before updating stock.");
      return;
    }
    setEditingProductId(row.product.id);
    setStockDraft(String(row.branchStock));
    setActionError("");
    setActionMessage("");
  }

  function cancelEditing() {
    setEditingProductId(null);
    setStockDraft("");
    setActionError("");
  }

  async function saveStock(productId: string) {
    setActionError("");
    setActionMessage("");

    if (!branchId) {
      setActionError("Select a branch to update stock.");
      return;
    }

    if (!stockDraft.trim()) {
      setActionError("Enter a stock quantity.");
      return;
    }

    const stock = Number(stockDraft);
    if (!Number.isInteger(stock) || stock < 0) {
      setActionError("Stock must be a non-negative whole number.");
      return;
    }

    try {
      const updated = await updateProductStock(productId, branchId, stock);
      // Update the row from the returned Product — no full reload needed.
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, ...updated } : p)),
      );
      setEditingProductId(null);
      setStockDraft("");
      setActionMessage("Branch stock updated.");
      // Refresh the summary counts.
      void loadProducts();
    } catch (saveError) {
      setActionError(normalizeError(saveError, "Unable to save the stock update.").message);
    }
  }

  const inventoryColumns: DashboardTableColumn<InventoryRow>[] = [
    {
      key: "product",
      header: "Product",
      render: ({ product }) => (
        <div className="min-w-48">
          <p className="font-medium text-brand-navy">{product.title}</p>
          <p className="text-xs text-text-slate">{product.category}</p>
        </div>
      ),
    },
    {
      key: "branch",
      header: inventoryBranch ? `${inventoryBranch.name} stock` : "Branch stock",
      render: ({ branchStock }) => branchStock,
    },
    {
      key: "total",
      header: branchScoped ? "Stock on hand" : "Total stock",
      render: ({ totalStock }) => totalStock,
    },
    {
      key: "value",
      header: "Inventory value",
      render: ({ product, branchStock }) => {
        const price = product.branchInventory?.find(
          (item) => item.branchId === branchId,
        )?.price ?? product.price;
        return formatPrice(price * branchStock);
      },
    },
    {
      key: "status",
      header: "Status",
      render: ({ status }) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            status === "In stock"
              ? "bg-status-success/10 text-status-success"
              : status === "Low stock"
                ? "bg-status-warning/10 text-status-warning"
                : "bg-status-error/10 text-status-error"
          }`}
        >
          {status}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row: InventoryRow) => {
        if (branchScoped && !managerBranchId) {
          return <span className="text-xs text-text-slate">No branch assigned</span>;
        }
        return editingProductId === row.product.id ? (
          <div className="flex min-w-48 items-center gap-2">
            <Input
              type="number"
              min="0"
              step="1"
              value={stockDraft}
              aria-label={`Stock quantity for ${row.product.title}`}
              onChange={(event) => {
                setStockDraft(event.target.value);
                setActionError("");
              }}
              className="w-24"
            />
            <Button
              variant="secondary"
              onClick={() => void saveStock(row.product.id)}
              className="inline-flex items-center gap-1"
            >
              <Check aria-hidden="true" size={15} />
              Save
            </Button>
            <Button
              variant="tertiary"
              onClick={cancelEditing}
              className="inline-flex items-center gap-1"
            >
              <X aria-hidden="true" size={15} />
              Cancel
            </Button>
          </div>
        ) : (
          <Button
            variant="tertiary"
            onClick={() => startEditing(row)}
            className="inline-flex items-center gap-2 whitespace-nowrap"
          >
            <Pencil aria-hidden="true" size={15} />
            Update stock
          </Button>
        );
      },
    },
  ];

  return (
    <section className="mx-auto grid min-w-0 w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <DashboardPageHeader
        subTitle={branchScoped ? "Branch manager dashboard" : "Admin dashboard"}
        title={branchScoped ? "Branch inventory" : "Inventory"}
        description={
          branchScoped
            ? "Review stock levels and identify products requiring restocking at your assigned branch."
            : "Review stock levels across branches and update per-branch stock."
        }
        actions={
          <Link
            to={branchScoped ? "/dashboard/branch" : "/dashboard/admin"}
            className="inline-flex items-center rounded-lg border border-border-subtle bg-surface-white px-4 py-2 text-sm font-medium text-brand-navy transition hover:bg-surface-cream"
          >
            Back to overview
          </Link>
        }
      />

      <div className={`grid gap-4 sm:grid-cols-2 ${branchScoped ? "xl:grid-cols-3" : "xl:grid-cols-4"}`}>
        <StatCard
          label="Products tracked"
          value={String(totals.all)}
          description={inventoryBranch?.name ?? "Select a branch"}
          icon={<Boxes size={20} />}
        />
        <StatCard
          label="Low stock"
          value={String(totals.low)}
          description="0 < stock <= 5"
          icon={<AlertTriangle size={20} />}
        />
        <StatCard
          label="Out of stock"
          value={String(totals.out)}
          description="Unavailable now"
          icon={<AlertTriangle size={20} />}
          trendType="negative"
        />
        {!branchScoped && (
          <StatCard
            label="Branches"
            value={String(branches.length)}
            description="Store locations"
            icon={<PackageSearch size={20} />}
          />
        )}
      </div>

      <DashboardCard
        title="Branch stock overview"
        description={
          branchScoped
            ? inventoryBranch
              ? `Stock for ${inventoryBranch.name}.`
              : "No branch is assigned to this manager."
            : inventoryBranch
              ? `Editing stock for ${inventoryBranch.name}.`
              : "Select a branch to view and edit its stock."
        }
      >
        {!branchScoped && branches.length > 0 && (
          <div className="mb-6 max-w-xs">
            <Label label="Branch">
              <Select
                value={adminBranchId}
                options={branches.map((branch) => ({
                  value: branch.id,
                  label: branch.name,
                }))}
                placeholder="Select a branch"
                onChange={(event) => {
                  setChosenBranchId(event.target.value);
                  setEditingProductId(null);
                  setPage(1);
                }}
              />
            </Label>
          </div>
        )}

        {/* Filters */}
        {branchId && (
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <Label label="Search">
              <Input
                type="search"
                value={search}
                placeholder="Search title, brand, description"
                onChange={(event) => setSearch(event.target.value)}
              />
            </Label>
            <Label label="Category">
              <Select
                value={category}
                options={categories.map((c) => ({ value: c, label: c }))}
                placeholder="All categories"
                onChange={(event) =>
                  resetPageOnFilter(() => setCategory(event.target.value))
                }
              />
            </Label>
            <Label label="Stock status">
              <Select
                value={stockStatus}
                options={[
                  { value: "", label: "All stock statuses" },
                  { value: "in", label: "In stock" },
                  { value: "low", label: "Low stock" },
                  { value: "out", label: "Out of stock" },
                ]}
                onChange={(event) =>
                  resetPageOnFilter(() =>
                    setStockStatus(event.target.value as "" | StockStatusFilter),
                  )
                }
              />
            </Label>
          </div>
        )}

        {isLoading && (
          <p className="py-12 text-center text-sm text-text-slate">
            Loading inventory...
          </p>
        )}

        {!isLoading && error && (
          <p className="py-8 text-center text-sm text-status-error">{error}</p>
        )}

        {actionError && <FormError message={actionError} />}
        {actionMessage && (
          <p className="mb-4 text-sm text-status-success" role="status">
            {actionMessage}
          </p>
        )}

        {!isLoading && !error && branchScoped && !managerBranchId && (
          <p className="py-8 text-center text-sm text-status-error" role="alert">
            No valid branch is assigned to this manager.
          </p>
        )}

        {!isLoading && !error && (!branchScoped || Boolean(managerBranchId)) && branchId && rows.length > 0 && (
          <>
            <DashboardTable
              columns={inventoryColumns}
              rows={rows}
              getRowKey={({ product }) => product.id}
            />
            {totalPages > 1 && (
              <nav className="mt-6 flex items-center justify-center gap-3" aria-label="Inventory pages">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg border border-border-subtle bg-surface-white px-4 py-2 text-sm font-medium text-brand-navy disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-text-slate">
                  Page {page} of {totalPages} · {total} products
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-border-subtle bg-surface-white px-4 py-2 text-sm font-medium text-brand-navy disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}

        {!isLoading && !error && (!branchScoped || Boolean(managerBranchId)) && branchId && rows.length === 0 && (
          <DashboardEmptyState
            title="No inventory found"
            description="Try changing the search or filters."
            icon={<Boxes size={22} />}
          />
        )}

        {!isLoading && !error && !branchId && !branchScoped && (
          <DashboardEmptyState
            title="Select a branch"
            description="Choose a branch above to view and edit its stock."
            icon={<PackageSearch size={22} />}
          />
        )}
      </DashboardCard>
    </section>
  );
}
