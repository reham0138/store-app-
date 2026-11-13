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
import { reportsService } from "../shared/services/reports.service";
import type { DashboardReport, ReportLowStockProduct } from "../shared/services/reports.service";
import type { Order } from "../shared/types/order";
import { formatPrice } from "../shared/utils/pricing";
import { shortOrderId } from "../shared/utils/orderId";
import { normalizeError } from "../shared/api/errors";

export default function DashboardBranchOverviewPage() {
  const { user } = useAuth();
  const branchId = user?.branchId;
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadReport() {
      try {
        const data = await reportsService.branch();
        if (isMounted) setReport(data);
      } catch (error) {
        if (isMounted) {
          setLoadError(
            normalizeError(error, "Failed to load branch data.").message,
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    queueMicrotask(() => void loadReport());
    return () => {
      isMounted = false;
    };
  }, [branchId]);

  const branchName =
    report?.branch?.name ??
    (branchId ? "Assigned branch" : "Branch not assigned");

  const revenueByDay = useMemo(
    () =>
      (report?.salesByDay ?? []).map(({ date, revenue }) => ({
        label: date.slice(5), // MM-DD
        value: revenue,
        displayValue: formatPrice(revenue),
      })),
    [report],
  );
  const orderStatusCounts = useMemo(
    () =>
      Object.entries(report?.ordersByStatus ?? {}).map(([status, count]) => ({
        label: status.charAt(0).toUpperCase() + status.slice(1),
        value: count,
      })),
    [report],
  );
  const topProducts = useMemo(
    () =>
      (report?.topProducts ?? []).map((p) => ({
        label: p.title,
        value: p.quantitySold,
      })),
    [report],
  );
  const salesByCategory = useMemo(
    () =>
      (report?.salesByCategory ?? []).map((c) => ({
        label: c.category,
        value: c.revenue,
        displayValue: formatPrice(c.revenue),
      })),
    [report],
  );
  const stockAlerts = report?.lowStockProducts ?? [];
  const stockAlertCount =
    (report?.lowStockProducts.length ?? 0) + (report?.outOfStockCount ?? 0);

  const stats = {
    revenue: report?.revenue ?? 0,
    totalOrders: report?.totalOrders ?? 0,
    pendingOrders: report?.ordersByStatus.pending ?? 0,
    averageOrderValue: report?.averageOrderValue ?? 0,
    outOfStockCount: report?.outOfStockCount ?? 0,
  };

  const recentOrderColumns: DashboardTableColumn<Order>[] = [
    {
      key: "order",
      header: "Order",
      render: (order) => (
        <span className="font-medium text-brand-navy" title={order.id}>
          {shortOrderId(order.id)}
        </span>
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
  const stockAlertColumns: DashboardTableColumn<ReportLowStockProduct>[] = [
    {
      key: "product",
      header: "Product",
      render: ({ title }) => (
        <div className="min-w-36">
          <p className="font-medium text-brand-navy">{title}</p>
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
  const recentOrders = report?.recentOrders ?? [];

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
          value={String(stockAlertCount)}
          description={`${stats.outOfStockCount} out of stock · low stock ≤ 5 units`}
          trendType={stockAlertCount > 0 ? "negative" : "positive"}
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
          description="Daily revenue for the last 30 days, excluding cancelled orders."
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
          title="Sales by category"
          description="Revenue per category in non-cancelled orders."
        >
          <DashboardChart
            data={salesByCategory}
            availableViews={["bar", "donut"]}
            emptyMessage="Categories will appear after orders are placed."
          />
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
          description="Products with 5 or fewer units at your branch."
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
              getRowKey={({ productId }) => productId}
            />
          ) : (
            <DashboardEmptyState
              title="No low-stock products"
              description="Products with 5 or fewer units will appear here."
              icon={<AlertTriangle size={22} />}
            />
          )}
        </DashboardCard>
      </div>
    </section>
  );
}
