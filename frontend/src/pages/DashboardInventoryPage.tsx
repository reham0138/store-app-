import {
  AlertTriangle,
  Boxes,
  PackageSearch,
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
import { useBranch } from "../shared/contexts/useBranch";
import type { StoreProduct } from "../shared/types/cart";
import { getProducts } from "../shared/services/product.service";
import { formatPrice } from "../shared/utils/pricing";
import { useAuth } from "../shared/hooks/useAuth";

interface DashboardInventoryPageProps {
  branchScoped?: boolean;
}

function getStockStatus(stock: number): "In stock" | "Low stock" | "Out of stock" {
  if (stock <= 0) return "Out of stock";
  if (stock <= 10) return "Low stock";
  return "In stock";
}

export default function DashboardInventoryPage({
  branchScoped = false,
}: DashboardInventoryPageProps) {
  const { branches, selectedBranch } = useBranch();
  const { user } = useAuth();
  const branchId = branchScoped ? user?.branchId : selectedBranch?.id;
  const inventoryBranch = branches.find((branch) => branch.id === branchId);
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
              : "Failed to load inventory.",
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

  const rows = useMemo(() => {
    return products.map((product) => {
      const branchStock = branchId
        ? product.branchInventory?.find(
            (item) => item.branchId === branchId,
          )?.stock ?? (branchScoped || product.branchInventory ? 0 : product.stock)
        : product.stock;
      const totalStock = branchScoped
        ? branchStock
        : product.branchInventory?.reduce(
            (sum, item) => sum + item.stock,
            0,
          ) ?? product.stock;

      return {
        product,
        totalStock,
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

  const inventoryColumns: DashboardTableColumn<{
    product: StoreProduct;
    totalStock: number;
    branchStock: number;
    status: "In stock" | "Low stock" | "Out of stock";
  }>[] = [
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
      render: ({ product, totalStock }) => {
        if (!branchScoped && product.branchInventory) {
          const value = product.branchInventory.reduce(
            (total, item) => total + item.price * item.stock,
            0,
          );
          return formatPrice(value);
        }

        const price = product.branchInventory?.find(
          (item) => item.branchId === branchId,
        )?.price ?? product.price;
        return formatPrice(price * totalStock);
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
  ];

  return (
    <section className="mx-auto grid min-w-0 w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <DashboardPageHeader
        subTitle={branchScoped ? "Branch manager dashboard" : "Admin dashboard"}
        title={branchScoped ? "Branch inventory" : "Inventory"}
        description={
          branchScoped
            ? "Review stock levels and identify products requiring restocking at your assigned branch."
            : "Review stock levels across branches and identify products requiring restocking."
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
              ? `Current branch focus: ${inventoryBranch.name}. Total stock covers all branches.`
              : "Showing the default inventory snapshot across all branches."
        }
      >
        {isLoading && (
          <p className="py-12 text-center text-sm text-text-slate">
            Loading inventory...
          </p>
        )}

        {!isLoading && error && (
          <p className="py-8 text-center text-sm text-status-error">{error}</p>
        )}

        {!isLoading && !error && branchScoped && !inventoryBranch && (
          <p className="py-8 text-center text-sm text-status-error" role="alert">
            No valid branch is assigned to this manager.
          </p>
        )}

        {!isLoading && !error && (!branchScoped || Boolean(inventoryBranch)) && rows.length > 0 && (
          <DashboardTable
            columns={inventoryColumns}
            rows={rows}
            getRowKey={({ product }) => String(product.id)}
          />
        )}

        {!isLoading && !error && (!branchScoped || Boolean(inventoryBranch)) && rows.length === 0 && (
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