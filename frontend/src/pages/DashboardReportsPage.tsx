import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CircleDollarSign,
  PackageSearch,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
import { useBranch } from "../shared/contexts/useBranch";
import { useOrders } from "../shared/hooks/useOrders";
import type { Order } from "../shared/types/order";
import type { StoreProduct } from "../shared/types/cart";
import { getProducts } from "../shared/services/product.service";
import { formatPrice } from "../shared/utils/pricing";
import {
  getInventoryStockLevels,
  getOrderStatusCounts,
  getRevenueByDay,
  getTopProducts,
} from "../shared/utils/dashboardMetrics";
import {
  getBranchOperationalStatuses,
  saveBranchOperationalStatus,
} from "../shared/utils/branchStatusStorage";
import type { BranchOperationalStatus } from "../shared/utils/branchStatusStorage";

interface BranchSalesRow {
  branchId: string;
  branchName: string;
  revenue: number;
  orderCount: number;
  activity: "Active" | "No recent sales";
}

export default function DashboardReportsPage() {
  const orders = useOrders();
  const { branches, isLoading: isBranchesLoading, error: branchesError } = useBranch();
  const [branchStatuses, setBranchStatuses] = useState<
    Record<string, BranchOperationalStatus>
  >({});
  const [branchStatusError, setBranchStatusError] = useState("");
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        const loadedProducts = await getProducts();
        if (isMounted) setProducts(loadedProducts);
      } catch (error) {
        if (isMounted) {
          setProductsError(
            error instanceof Error ? error.message : "Failed to load inventory.",
          );
        }
      } finally {
        if (isMounted) setProductsLoading(false);
      }
    }

    void loadProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const refreshStatuses = () => {
      try {
        setBranchStatuses(getBranchOperationalStatuses());
        setBranchStatusError("");
      } catch (error) {
        setBranchStatusError(
          error instanceof Error ? error.message : "Unable to load branch statuses.",
        );
      }
    };

    refreshStatuses();
    window.addEventListener("storage", refreshStatuses);
    window.addEventListener("branch-status-updated", refreshStatuses);
    return () => {
      window.removeEventListener("storage", refreshStatuses);
      window.removeEventListener("branch-status-updated", refreshStatuses);
    };
  }, []);

  const branchSalesRows = useMemo(() => {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    startDate.setDate(startDate.getDate() - 29);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);

    return branches.map((branch) => {
      const branchOrders = orders.filter((order) => {
        const orderDate = new Date(order.createdAt).getTime();
        return (
          order.branch?.id === branch.id &&
          order.status !== "cancelled" &&
          orderDate >= startDate.getTime() &&
          orderDate < endDate.getTime()
        );
      });

      return {
        branchId: branch.id,
        branchName: branch.name,
        revenue: branchOrders.reduce((total, order) => total + order.total, 0),
        orderCount: branchOrders.length,
        activity: branchOrders.length > 0 ? "Active" : "No recent sales",
      } satisfies BranchSalesRow;
    });
  }, [branches, orders]);

  function updateBranchStatus(
    branchId: string,
    status: BranchOperationalStatus | "",
  ) {
    setBranchStatusError("");
    try {
      setBranchStatuses(saveBranchOperationalStatus(branchId, status));
    } catch (error) {
      setBranchStatusError(
        error instanceof Error ? error.message : "Unable to save branch status.",
      );
    }
  }

  const branchSalesData = branchSalesRows.map((branch) => ({
    key: `branch-${branch.branchId}`,
    label: branch.branchName,
    value: branch.revenue,
    displayValue: formatPrice(branch.revenue),
  }));

  function parseBranchStatus(value: string): BranchOperationalStatus | "" {
    if (value === "open" || value === "closed") return value;
    return "";
  }

  const branchSalesColumns: DashboardTableColumn<BranchSalesRow>[] = [
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
      render: ({ branchId }) => {
        const status = branchStatuses[branchId] ?? "";
        return (
          <Select
            aria-label={`Set operating status for ${branches.find((branch) => branch.id === branchId)?.name ?? "branch"}`}
            value={status}
            options={[
              { value: "", label: "Not set" },
              { value: "open", label: "Open" },
              { value: "closed", label: "Closed" },
            ]}
            onChange={(event) =>
              updateBranchStatus(branchId, parseBranchStatus(event.currentTarget.value))
            }
          />
        );
      },
    },
    {
      key: "activity",
      header: "Sales activity",
      render: ({ activity }) => (
        <span
          className={`inline-flex items-center gap-2 text-sm ${
            activity === "Active" ? "text-status-success" : "text-text-slate"
          }`}
        >
          <Activity aria-hidden="true" size={15} />
          {activity}
        </span>
      ),
    },
    {
      key: "orders",
      header: "Orders",
      render: ({ orderCount }) => orderCount,
    },
    {
      key: "revenue",
      header: "Sales (30 days)",
      render: ({ revenue }) => formatPrice(revenue),
    },
  ];

  const stats = useMemo(() => {
    const paidOrders = orders.filter((order) => order.status !== "cancelled");
    const revenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
    const avgOrder = paidOrders.length ? revenue / paidOrders.length : 0;
    const pendingOrders = orders.filter((order) => order.status === "pending").length;

    const categoryTotals = new Map<string, number>();

    paidOrders.forEach((order) => {
      order.items.forEach((item) => {
        const category = item.product.category;
        categoryTotals.set(
          category,
          (categoryTotals.get(category) ?? 0) + item.quantity,
        );
      });
    });

    const topCategory = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1])[0];

    return {
      revenue,
      avgOrder,
      pendingOrders,
      totalOrders: orders.length,
      topCategory,
    };
  }, [orders]);

  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 6);
  const revenueByDay = getRevenueByDay(orders).map(({ label, value }) => ({
    label,
    value,
    displayValue: formatPrice(value),
  }));
  const orderStatusCounts = getOrderStatusCounts(orders).map(
    ({ status, count }) => ({
      label: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
    }),
  );
  const topProducts = getTopProducts(orders);
  const inventoryStockLevels = getInventoryStockLevels(products);

  const categoryColumns: DashboardTableColumn<{
    category: string;
    quantity: number;
  }>[] = [
    {
      key: "category",
      header: "Category",
      render: ({ category }) => category,
    },
    {
      key: "units",
      header: "Units sold",
      render: ({ quantity }) => quantity,
    },
  ];

  const categoryRows = useMemo(() => {
    const map = new Map<string, number>();

    orders
      .filter((order) => order.status !== "cancelled")
      .forEach((order) => {
        order.items.forEach((item) => {
          map.set(
            item.product.category,
            (map.get(item.product.category) ?? 0) + item.quantity,
          );
        });
      });

    return [...map.entries()]
      .map(([category, quantity]) => ({ category, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [orders]);

  const orderColumns: DashboardTableColumn<Order>[] = [
    {
      key: "order",
      header: "Order",
      render: (order) => <span className="font-medium text-brand-navy">{order.id}</span>,
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
        subTitle="Manager dashboard"
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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue"
          value={formatPrice(stats.revenue)}
          description="Order totals excluding cancelled orders"
          icon={<CircleDollarSign size={20} />}
        />
        <StatCard
          label="Average order"
          value={formatPrice(stats.avgOrder)}
          description="Across non-cancelled orders"
          icon={<BarChart3 size={20} />}
        />
        <StatCard
          label="Pending orders"
          value={String(stats.pendingOrders)}
          description="Need attention"
          icon={<PackageSearch size={20} />}
        />
        <StatCard
          label="Top category"
          value={stats.topCategory ? stats.topCategory[0] : "—"}
          description={
            stats.topCategory ? `${stats.topCategory[1]} units sold` : "No data"
          }
          icon={<ArrowUpRight size={20} />}
        />
      </div>

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
          description="Current order workload across the store."
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
          title="Inventory health"
          description="Count of product listings by stock level across branches."
        >
          {productsLoading ? (
            <p className="py-8 text-center text-sm text-text-slate">
              Loading inventory...
            </p>
          ) : productsError ? (
            <FormError message={productsError} />
          ) : (
            <DashboardChart
              data={inventoryStockLevels}
              availableViews={["bar", "donut"]}
            />
          )}
        </DashboardCard>
      </div>

      <DashboardCard
        title="Branch performance"
        description="Compare sales from the last 30 days, review sales activity, and set each branch's operating status."
      >
        {branchStatusError && (
          <div className="mb-4">
            <FormError message={branchStatusError} />
          </div>
        )}
        {branchesError && (
          <div className="mb-4">
            <FormError message={branchesError} />
          </div>
        )}
        {isBranchesLoading ? (
          <p className="py-8 text-center text-sm text-text-slate">
            Loading branches...
          </p>
        ) : branchSalesRows.length > 0 ? (
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
                rows={branchSalesRows}
                getRowKey={({ branchId }) => branchId}
              />
              <p className="mt-4 text-xs leading-5 text-text-slate">
                Sales activity is based on non-cancelled orders in the last 30 days.
                Operating status is set by an administrator and saved in this browser.
              </p>
            </div>
          </div>
        ) : (
          <DashboardEmptyState
            title="No branches available"
            description="Branch sales and operating status will appear here once branches are loaded."
            icon={<Activity size={22} />}
          />
        )}
      </DashboardCard>

      <div className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
        <DashboardCard title="Recent orders" description="Latest transactions in the store.">
          {recentOrders.length > 0 ? (
            <DashboardTable
              columns={orderColumns}
              rows={recentOrders}
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
          title="Top categories"
          description="Best-performing product groups."
        >
          {categoryRows.length > 0 ? (
            <DashboardTable
              columns={categoryColumns}
              rows={categoryRows}
              getRowKey={({ category }) => category}
            />
          ) : (
            <DashboardEmptyState
              title="No sales data"
              description="Orders will populate this report automatically."
              icon={<BarChart3 size={22} />}
            />
          )}
        </DashboardCard>
      </div>
    </section>
  );
}