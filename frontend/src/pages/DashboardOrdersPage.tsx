import { ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";

import {
  DashboardCard,
  DashboardEmptyState,
  DashboardPageHeader,
  DashboardTable,
} from "../shared/components/dashboard";
import type { DashboardTableColumn } from "../shared/components/dashboard";
import OrderStatus from "../shared/components/OrderStatus";
import { useOrders } from "../shared/hooks/useOrders";
import { formatPrice } from "../shared/utils/pricing";
import type { Order } from "../shared/types/order";

const orderColumns: DashboardTableColumn<Order>[] = [
  {
    key: "id",
    header: "Order",
    render: (order) => (
      <span className="font-medium text-brand-navy">{order.id}</span>
    ),
  },
  {
    key: "customer",
    header: "Customer",
    render: (order) => order.shippingAddress.fullName || "Unnamed customer",
  },
  {
    key: "date",
    header: "Date",
    render: (order) => new Date(order.createdAt).toLocaleDateString(),
  },
  {
    key: "items",
    header: "Items",
    render: (order) =>
      order.items.reduce((total, item) => total + item.quantity, 0),
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

export default function DashboardOrdersPage() {
  const orders = useOrders();

  return (
    <section className="mx-auto grid min-w-0 w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <DashboardPageHeader
        subTitle="Manager dashboard"
        title="Orders"
        description="Review all orders currently stored for the store."
        actions={
          <Link
            to="/dashboard"
            className="inline-flex items-center rounded-lg border border-border-subtle bg-surface-white px-4 py-2 text-sm font-medium text-brand-navy transition hover:bg-surface-cream"
          >
            Back to overview
          </Link>
        }
      />

      <DashboardCard title="All orders">
        {orders.length > 0 ? (
          <DashboardTable
            columns={orderColumns}
            rows={orders}
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
    </section>
  );
}