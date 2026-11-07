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
import { useAuth } from "../shared/hooks/useAuth";

interface DashboardOrdersPageProps {
  branchScoped?: boolean;
}

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

export default function DashboardOrdersPage({
  branchScoped = false,
}: DashboardOrdersPageProps) {
  const orders = useOrders();
  const { user } = useAuth();
  const visibleOrders = branchScoped
    ? orders.filter((order) => order.branch?.id === user?.branchId)
    : orders;

  return (
    <section className="mx-auto grid min-w-0 w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <DashboardPageHeader
        subTitle={branchScoped ? "Branch manager dashboard" : "Admin dashboard"}
        title="Orders"
        description={
          branchScoped
            ? "Review orders placed through your assigned branch."
            : "Review all orders currently stored for the store."
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

      <DashboardCard title="All orders">
        {visibleOrders.length > 0 ? (
          <DashboardTable
            columns={orderColumns}
            rows={visibleOrders}
            getRowKey={(order) => order.id}
          />
        ) : (
          <DashboardEmptyState
            title="No orders yet"
            description={
              branchScoped
                ? "Orders for this branch will appear here."
                : "Orders created during checkout will appear here."
            }
            icon={<ClipboardList size={22} />}
          />
        )}
      </DashboardCard>
    </section>
  );
}