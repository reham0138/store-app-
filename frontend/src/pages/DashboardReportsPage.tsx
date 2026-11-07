import {
  ArrowUpRight,
  BarChart3,
  CircleDollarSign,
  PackageSearch,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import {
  DashboardCard,
  DashboardEmptyState,
  DashboardPageHeader,
  DashboardTable,
  StatCard,
} from "../shared/components/dashboard";
import type { DashboardTableColumn } from "../shared/components/dashboard";
import OrderStatus from "../shared/components/OrderStatus";
import { useOrders } from "../shared/hooks/useOrders";
import type { Order } from "../shared/types/order";
import { formatPrice } from "../shared/utils/pricing";

export default function DashboardReportsPage() {
  const orders = useOrders();

  const stats = useMemo(() => {
    const paidOrders = orders.filter((order) => order.status !== "cancelled");
    const revenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
    const avgOrder = paidOrders.length ? revenue / paidOrders.length : 0;
    const pendingOrders = orders.filter((order) => order.status === "pending").length;

    const categoryTotals = new Map<string, number>();

    orders.forEach((order) => {
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

    orders.forEach((order) => {
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