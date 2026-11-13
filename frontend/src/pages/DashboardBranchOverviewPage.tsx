import {
  AlertTriangle,
  ArrowRight,
  ChartColumnIncreasing,
  CircleDollarSign,
  ClipboardList,
  PackageSearch,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  DashboardChart,
  DashboardCard,
  DashboardEmptyState,
  DashboardPageHeader,
  DashboardTable,
  StatCard,
} from "../shared/components/dashboard";
import type { DashboardTableColumn } from "../shared/components/dashboard";
import OrderStatus from "../shared/components/OrderStatus";
import { FormError } from "../shared/components/FormError";
import { useAuth } from "../shared/hooks/useAuth";
import { useOrders } from "../shared/hooks/useOrders";
import { getProducts } from "../shared/services/product.service";
import type { StoreProduct } from "../shared/types/cart";
import type { Order } from "../shared/types/order";
import { useBranch } from "../shared/contexts/useBranch";
import {
  getInventoryStockLevels,
  getOrderStatusCounts,
  getRevenueByDay,
  getTopProducts,
} from "../shared/utils/dashboardMetrics";
import { formatPrice } from "../shared/utils/pricing";

interface BranchStockAlert {
  product: StoreProduct;
  stock: number;
}

function getBranchStock(product: StoreProduct, branchId: string): number {
  return (
    product.branchInventory?.find((inventory) => inventory.branchId === branchId)
      ?.stock ?? 0
  );
}

export default function DashboardBranchOverviewPage() {
  const { user } = useAuth();
  const { branches } = useBranch();
  const orders = useOrders();
  const branchId = user?.branchId;
  const branchName =
    branches.find((branch) => branch.id === branchId)?.name ??
    "Branch not assigned";
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        const loadedProducts = await getProducts();
        if (isMounted) setProducts(loadedProducts);
      } catch (error) {
        if (isMounted) {
          setLoadError(
            error instanceof Error ? error.message : "Failed to load branch data.",
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

  const branchOrders = useMemo(
    () =>
      branchId
        ? orders.filter((order) => order.branch?.id === branchId)
        : [],
    [orders, branchId],
  );
  const revenueByDay = useMemo(
    () =>
      getRevenueByDay(branchOrders).map(({ label, value }) => ({
        label,
        value,
        displayValue: formatPrice(value),
      })),
    [branchOrders],
  );
  const orderStatusCounts = useMemo(
    () =>
      getOrderStatusCounts(branchOrders).map(({ status, count }) => ({
        label: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
      })),
    [branchOrders],
  );
  const topProducts = useMemo(
    () => getTopProducts(branchOrders),
    [branchOrders],
  );
  const inventoryStockLevels = useMemo(
    () => (branchId ? getInventoryStockLevels(products, branchId) : []),
    [products, branchId],
  );
  const stockAlerts = useMemo<BranchStockAlert[]>(
    () =>
      branchId
        ? products
            .map((product) => ({
              product,
              stock: getBranchStock(product, branchId),
            }))
            .filter(({ stock }) => stock <= 10)
            .sort((a, b) => a.stock - b.stock)
            .slice(0, 5)
        : [],
    [products, branchId],
  );
  const stats = useMemo(() => {
    const activeOrders = branchOrders.filter(
      (order) => order.status !== "cancelled",
    );

    return {
      revenue: activeOrders.reduce((total, order) => total + order.total, 0),
      totalOrders: branchOrders.length,
      pendingOrders: branchOrders.filter(
        (order) => order.status === "pending",
      ).length,
      stockAlerts: branchId
        ? products.filter((product) => getBranchStock(product, branchId) <= 10)
            .length
        : 0,
    };
  }, [branchOrders, products, branchId]);

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
  const stockAlertColumns: DashboardTableColumn<BranchStockAlert>[] = [
    {
      key: "product",
      header: "Product",
      render: ({ product }) => (
        <div className="min-w-36">
          <p className="font-medium text-brand-navy">{product.title}</p>
          <p className="text-xs text-text-slate">{product.category}</p>
        </div>
      ),
    },
    {
      key: "stock",
      header: "Units left",
      render: ({ stock }) => stock,
    },
    {
      key: "status",
      header: "Status",
      render: ({ stock }) => (
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            stock === 0
              ? "bg-status-error/10 text-status-error"
              : "bg-status-warning/10 text-status-warning"
          }`}
        >
          {stock === 0 ? "Out of stock" : "Low stock"}
        </span>
      ),
    },
  ];
  const recentOrders = [...branchOrders]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  return (
    <section className="mx-auto grid min-w-0 w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <DashboardPageHeader
        subTitle="Branch manager dashboard"
        title="Branch overview"
        description={`A quick look at orders and inventory for ${branchName}.`}
        actions={
          <>
            <Link
              to="/dashboard/branch/orders"
              className="inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-white px-4 py-2 text-sm font-medium text-brand-navy transition hover:bg-surface-cream"
            >
              <ClipboardList aria-hidden="true" size={16} />
              View orders
            </Link>
            <Link
              to="/dashboard/branch/inventory"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-navy/90"
            >
              <PackageSearch aria-hidden="true" size={16} />
              Manage inventory
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatPrice(stats.revenue)}
          description="Excludes cancelled orders"
          icon={<CircleDollarSign size={20} />}
        />
        <StatCard
          label="Orders"
          value={String(stats.totalOrders)}
          description="Placed at this branch"
          icon={<ClipboardList size={20} />}
        />
        <StatCard
          label="Pending orders"
          value={String(stats.pendingOrders)}
          description="Need attention"
          icon={<ChartColumnIncreasing size={20} />}
        />
        <StatCard
          label="Stock alerts"
          value={String(stats.stockAlerts)}
          description="Products at 10 units or less"
          trendType={stats.stockAlerts > 0 ? "negative" : "positive"}
          icon={<AlertTriangle size={20} />}
        />
      </div>

      {!branchId && (
        <p className="rounded-xl border border-status-error/30 bg-status-error/5 p-4 text-sm text-status-error" role="alert">
          No branch is assigned to this manager. Ask an administrator to assign a branch.
        </p>
      )}
      {loadError && <FormError message={loadError} />}

      <div className="grid gap-8 xl:grid-cols-2">
        <DashboardCard
          title="Revenue trend"
          description="Daily revenue for the last seven days, excluding cancelled orders."
        >
          <DashboardChart
            data={revenueByDay}
            availableViews={["bar", "line"]}
          />
        </DashboardCard>
        <DashboardCard
          title="Orders by status"
          description="Current order workload for this branch."
        >
          <DashboardChart
            data={orderStatusCounts}
            availableViews={["bar", "donut"]}
          />
        </DashboardCard>
        <DashboardCard
          title="Best-selling products"
          description="Top products by units in non-cancelled branch orders."
        >
          <DashboardChart
            data={topProducts}
            availableViews={["bar", "donut"]}
            emptyMessage="Products will appear after branch orders are placed."
          />
        </DashboardCard>
        <DashboardCard
          title="Inventory health"
          description="Count of product listings by stock level at this branch."
        >
          {isLoading ? (
            <p className="py-8 text-center text-sm text-text-slate">
              Loading inventory...
            </p>
          ) : loadError ? (
            <FormError message={loadError} />
          ) : (
            <DashboardChart
              data={inventoryStockLevels}
              availableViews={["bar", "donut"]}
              emptyMessage="Assign a branch to view its inventory health."
            />
          )}
        </DashboardCard>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.4fr_1fr]">
        <DashboardCard
          title="Recent orders"
          description="The latest orders placed through your branch."
          actions={
            <Link
              to="/dashboard/branch/orders"
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
              title="No branch orders yet"
              description="Orders placed through your branch will appear here."
              icon={<ClipboardList size={22} />}
            />
          )}
        </DashboardCard>

        <DashboardCard
          title="Stock alerts"
          description="Products that may need replenishment at your branch."
          actions={
            <Link
              to="/dashboard/branch/inventory"
              className="inline-flex items-center gap-2 text-sm font-medium text-brand-navy hover:text-brand-gold"
            >
              Manage
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
              getRowKey={({ product }) => String(product.id)}
            />
          ) : (
            <DashboardEmptyState
              title="No stock alerts"
              description="Low and out-of-stock products will appear here."
              icon={<AlertTriangle size={22} />}
            />
          )}
        </DashboardCard>
      </div>
    </section>
  );
}
