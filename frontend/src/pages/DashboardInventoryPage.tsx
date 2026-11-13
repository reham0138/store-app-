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
  getStockStatus,
  inventoryService,
} from "../shared/services/inventory.service";
import { normalizeError } from "../shared/api/errors";

interface DashboardInventoryPageProps {
  branchScoped?: boolean;
}

interface InventoryRow {
  product: StoreProduct;
  totalStock: number;
  branchStock: number;
  status: "In stock" | "Low stock" | "Out of stock";
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
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [stockDraft, setStockDraft] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const loadProducts = useCallback(async () => {
    try {
      const data = await inventoryService.list(branchId);
      setProducts(data);
      setError("");
    } catch (loadError) {
      setError(normalizeError(loadError, "Failed to load inventory.").message);
    } finally {
      setIsLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    queueMicrotask(() => void loadProducts());
  }, [loadProducts]);

  const rows = useMemo(() => {
    return products.map((product) => {
      const branchStock = branchId
        ? product.branchInventory?.find(
            (item) => item.branchId === branchId,
          )?.stock ?? (branchScoped || product.branchInventory ? 0 : product.stock)
        : product.stock;
      const totalStock = product.branchInventory?.reduce(
        (sum, item) => sum + item.stock,
        0,
      ) ?? product.stock;

      return {
        product,
        totalStock: branchScoped ? branchStock : totalStock,
        branchStock,
        status: getStockStatus(branchStock),
      };
    });
  }, [products, branchId, branchScoped]);

  const stats = useMemo(() => {
    const lowStock = rows.filter((row) => row.status === "Low stock").length;
    const outOfStock = rows.filter((row) => row.status === "Out of stock").length;

    return {
      totalProducts: rows.length,
      lowStock,
      outOfStock,
      selectedBranchName: inventoryBranch?.name ?? "all branches",
    };
  }, [rows, inventoryBranch]);

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
      await inventoryService.updateStock(productId, branchId, stock);
      setEditingProductId(null);
      setStockDraft("");
      setActionMessage("Branch stock updated.");
      await loadProducts();
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
        return formatPrice(price * (branchId ? branchStock : product.stock));
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
          value={String(stats.totalProducts)}
          description={stats.selectedBranchName}
          icon={<Boxes size={20} />}
        />
        <StatCard
          label="Low stock"
          value={String(stats.lowStock)}
          description="Needs replenishment"
          icon={<AlertTriangle size={20} />}
        />
        <StatCard
          label="Out of stock"
          value={String(stats.outOfStock)}
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
                }}
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

        {!isLoading && !error && (!branchScoped || Boolean(managerBranchId)) && rows.length > 0 && (
          <DashboardTable
            columns={inventoryColumns}
            rows={rows}
            getRowKey={({ product }) => product.id}
          />
        )}

        {!isLoading && !error && (!branchScoped || Boolean(managerBranchId)) && rows.length === 0 && (
          <DashboardEmptyState
            title="No inventory found"
            description="Add products to the catalog to track stock levels."
            icon={<Boxes size={22} />}
          />
        )}
      </DashboardCard>
    </section>
  );
}
