import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CircleDollarSign,
  PackageSearch,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
  DashboardCard,
  DashboardChart,
  DashboardEmptyState,
  DashboardPageHeader,
  DashboardTable,
  StatCard,
} from "../shared/components/dashboard";
import type { DashboardTableColumn } from "../shared/components/dashboard";
import OrderStatus from "../shared/components/OrderStatus";
import { FormError } from "../shared/components/FormError";
import { Select } from "../shared/components/Select";
import { Label } from "../shared/components/Label";
import type { Order } from "../shared/types/order";
import type { Branch } from "../shared/types/type";
import { formatPrice } from "../shared/utils/pricing";
import { shortOrderId } from "../shared/utils/orderId";
import {
  reportsService,
  type DashboardReport,
  type ReportBranchSales,
  type ReportLowStockProduct,
} from "../shared/services/reports.service";
import { getBranches, updateBranchStatus as updateBranchStatusApi } from "../shared/services/branches.service";
import { normalizeError } from "../shared/api/errors";

interface BranchRow extends ReportBranchSales {
  branchName: string;
  operationalStatus: Branch["operationalStatus"];
}

export default function DashboardReportsPage() {
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [scopeBranchId, setScopeBranchId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [statusError, setStatusError] = useState("");

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [reportData, branchData] = await Promise.all([
        reportsService.admin(scopeBranchId || undefined),
        getBranches(),
      ]);
      setReport(reportData);
      setBranches(branchData);
      setLoadError("");
    } catch (error) {
      setLoadError(
        normalizeError(error, "Failed to load report data.").message,
      );
    } finally {
      setIsLoading(false);
    }
  }, [scopeBranchId]);

  useEffect(() => {
    queueMicrotask(() => void loadAll());
  }, [loadAll]);

  async function updateBranchStatus(
    branchId: string,
    status: "open" | "closed" | "",
  ) {
    if (status === "") return;
    setStatusError("");
    try {
      await updateBranchStatusApi(branchId, status);
      setBranches(await getBranches());
    } catch (error) {
      setStatusError(
        normalizeError(error, "Unable to save branch status.").message,
      );
    }
  }

  // byBranch rows joined with branch names/status for the admin table.
  const branchRows = useMemo<BranchRow[]>(() => {
    const byBranch = report?.byBranch ?? [];
    return byBranch.map((row) => {
      const branch = branches.find((b) => b.id === row.branchId);
      return {
        ...row,
        branchName: branch?.name ?? row.branchId,
        operationalStatus: branch?.operationalStatus,
      };
    });
  }, [report, branches]);

  const branchNameById = useMemo(
    () => new Map(branches.map((b) => [b.id, b.name])),
    [branches],
  );

  const revenueByDay = useMemo(
    () =>
      (report?.salesByDay ?? []).map(({ date, revenue }) => ({
        label: date.slice(5),
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

  const stats = {
    revenue: report?.revenue ?? 0,
    averageOrderValue: report?.averageOrderValue ?? 0,
    totalOrders: report?.totalOrders ?? 0,
    pendingOrders: report?.ordersByStatus.pending ?? 0,
    outOfStockCount: report?.outOfStockCount ?? 0,
  };

  const branchSalesData = branchRows.map((branch) => ({
    key: `branch-${branch.branchId}`,
    label: branch.branchName,
    value: branch.revenue,
    displayValue: formatPrice(branch.revenue),
  }));

  function parseBranchStatus(value: string): "open" | "closed" | "" {
    if (value === "open" || value === "closed") return value;
    return "";
  }

  const branchSalesColumns: DashboardTableColumn<BranchRow>[] = [
    {
      key: "branch",
      header: "Branch",
      render: ({ branchName }) => (
        <span className="font-medium text-brand-navy">{branchName}</span>
      ),
    },
    {
      key: "operational-status",
      header: "Operating status",
      render: ({ branchId, operationalStatus }) => (
        <Select
          aria-label={`Set operating status for ${branchNameById.get(branchId) ?? "branch"}`}
          value={operationalStatus ?? ""}
          options={[
            { value: "", label: "Not set" },
            { value: "open", label: "Open" },
            { value: "closed", label: "Closed" },
          ]}
          onChange={(event) =>
            updateBranchStatus(branchId, parseBranchStatus(event.currentTarget.value))
          }
        />
      ),
    },
    {
      key: "activity",
      header: "Sales activity",
      render: ({ totalOrders }) => (
        <span
          className={`inline-flex items-center gap-2 text-sm ${
            totalOrders > 0 ? "text-status-success" : "text-text-slate"
          }`}
        >
          <Activity aria-hidden="true" size={15} />
          {totalOrders > 0 ? "Active" : "No recent sales"}
        </span>
      ),
    },
    {
      key: "orders",
      header: "Orders",
      render: ({ totalOrders }) => totalOrders,
    },
    {
      key: "revenue",
      header: "Revenue",
      render: ({ revenue }) => formatPrice(revenue),
    },
  ];

  const lowStockColumns: DashboardTableColumn<ReportLowStockProduct>[] = [
    {
      key: "product",
      header: "Product",
      render: ({ title }) => (
        <span className="font-medium text-brand-navy">{title}</span>
      ),
    },
    {
      key: "branch",
      header: "Branch",
      render: ({ branchId }) => branchNameById.get(branchId) ?? branchId,
    },
    {
      key: "stock",
      header: "Units left",
      render: ({ stock }) => stock,
    },
  ];

  const orderColumns: DashboardTableColumn<Order>[] = [
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

  return (
    <section className="mx-auto grid min-w-0 w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <DashboardPageHeader
        subTitle="Admin dashboard"
        title="Reports"
        description="Track revenue, recent orders, and top-selling categories."
        actions={
          <Link
            to="/dashboard/admin"
            className="inline-flex items-center rounded-lg border border-border-subtle bg-surface-white px-4 py-2 text-sm font-medium text-brand-navy transition hover:bg-surface-cream"
          >
            Back to overview
          </Link>
        }
      />

      <div className="max-w-xs">
        <Label label="Branch scope">
          <Select
            value={scopeBranchId}
            options={[
              { value: "", label: "All branches" },
              ...branches.map((branch) => ({
                value: branch.id,
                label: branch.name,
              })),
            ]}
            onChange={(event) => setScopeBranchId(event.target.value)}
          />
        </Label>
      </div>

      {isLoading && (
        <p className="py-12 text-center text-sm text-text-slate" role="status">
          Loading report…
        </p>
      )}
      {!isLoading && loadError && (
        <div className="py-8 text-center">
          <FormError message={loadError} />
          <button
            type="button"
            onClick={() => void loadAll()}
            className="mt-4 rounded-lg bg-brand-navy px-4 py-2 text-sm text-white"
          >
            Try Again
          </button>
        </div>
      )}

      {!isLoading && !loadError && report && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Revenue"
              value={formatPrice(stats.revenue)}
              description="Order totals excluding cancelled orders"
              icon={<CircleDollarSign size={20} />}
            />
            <StatCard
              label="Average order"
              value={formatPrice(stats.averageOrderValue)}
              description="Across non-cancelled orders"
              icon={<BarChart3 size={20} />}
            />
            <StatCard
              label="Total orders"
              value={String(stats.totalOrders)}
              description={`${stats.pendingOrders} pending`}
              icon={<PackageSearch size={20} />}
            />
            <StatCard
              label="Out of stock"
              value={String(stats.outOfStockCount)}
              description="Branch/product pairs at zero stock"
              trendType={stats.outOfStockCount > 0 ? "negative" : "positive"}
              icon={<ArrowUpRight size={20} />}
            />
          </div>

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
              description="Current order workload in scope."
            >
              <DashboardChart
                data={orderStatusCounts}
                availableViews={["bar", "donut"]}
              />
            </DashboardCard>
            <DashboardCard
              title="Best-selling products"
              description="Top products by units in non-cancelled orders."
            >
              <DashboardChart
                data={topProducts}
                availableViews={["bar", "donut"]}
                emptyMessage="Products will appear after orders are placed."
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

          <DashboardCard
            title="Branch performance"
            description="Compare revenue across branches and set each branch's operating status."
          >
            {statusError && (
              <div className="mb-4">
                <FormError message={statusError} />
              </div>
            )}
            {report.byBranch && report.byBranch.length > 0 ? (
              <div className="grid gap-8 xl:grid-cols-2">
                <div>
                  <h3 className="mb-5 text-sm font-semibold text-brand-navy">
                    Sales by branch
                  </h3>
                  <DashboardChart
                    data={branchSalesData}
                    availableViews={["bar", "line", "donut"]}
                    emptyMessage="No branch sales data for this period."
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="mb-5 text-sm font-semibold text-brand-navy">
                    Branch status and sales
                  </h3>
                  <DashboardTable
                    columns={branchSalesColumns}
                    rows={branchRows}
                    getRowKey={({ branchId }) => branchId}
                  />
                  <p className="mt-4 text-xs leading-5 text-text-slate">
                    Revenue excludes cancelled orders. Operating status is set
                    by an administrator and saved to the backend.
                  </p>
                </div>
              </div>
            ) : (
              <DashboardEmptyState
                title="No branch data"
                description="Branch sales appear when the report covers all branches."
                icon={<Activity size={22} />}
              />
            )}
          </DashboardCard>

          <div className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
            <DashboardCard title="Recent orders" description="Latest transactions in the store.">
              {report.recentOrders.length > 0 ? (
                <DashboardTable
                  columns={orderColumns}
                  rows={report.recentOrders}
                  getRowKey={(order) => order.id}
                />
              ) : (
                <DashboardEmptyState
                  title="No orders yet"
                  description="Orders created during checkout will appear here."
                  icon={<PackageSearch size={22} />}
                />
              )}
            </DashboardCard>

            <DashboardCard
              title="Low stock"
              description="Branch/product pairs with 5 or fewer units."
            >
              {report.lowStockProducts.length > 0 ? (
                <DashboardTable
                  columns={lowStockColumns}
                  rows={report.lowStockProducts}
                  getRowKey={({ productId, branchId }) => `${productId}:${branchId}`}
                />
              ) : (
                <DashboardEmptyState
                  title="No low-stock products"
                  description="Products with 5 or fewer units will appear here."
                  icon={<BarChart3 size={22} />}
                />
              )}
            </DashboardCard>
          </div>
        </>
      )}
    </section>
  );
}
