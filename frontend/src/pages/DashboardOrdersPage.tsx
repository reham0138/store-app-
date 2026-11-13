import { ClipboardList } from "lucide-react";
import { useState } from "react";
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
import { Select } from "../shared/components/Select";
import { FormError } from "../shared/components/FormError";
import { updateOrderStatus } from "../shared/utils/orderStorage";
import type { OrderStatus as OrderStatusValue } from "../shared/types/order";

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
];

const orderStatuses: { value: OrderStatusValue; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function DashboardOrdersPage({
  branchScoped = false,
}: DashboardOrdersPageProps) {
  const orders = useOrders();
  const { user } = useAuth();
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const assignedBranchId = user?.branchId;
  const visibleOrders = branchScoped
    ? orders.filter(
        (order) =>
          Boolean(assignedBranchId) && order.branch?.id === assignedBranchId,
      )
    : orders;
  const columns: DashboardTableColumn<Order>[] = [
    ...orderColumns,
    {
      key: "status",
      header: "Status",
      render: (order) => (
        <div className="flex min-w-40 items-center gap-2">
          <OrderStatus status={order.status} />
          <Select
            aria-label={`Update status for order ${order.id}`}
            value={order.status}
            options={orderStatuses}
            disabled={branchScoped && !user?.branchId}
            onChange={(event) => {
              const status = event.currentTarget.value as OrderStatusValue;
              setActionError("");
              setActionMessage("");
              try {
                updateOrderStatus(
                  order.id,
                  status,
                  branchScoped ? user?.branchId ?? "" : undefined,
                );
                setActionMessage(`Order ${order.id} updated to ${status}.`);
              } catch (error) {
                setActionError(
                  error instanceof Error
                    ? error.message
                    : "Unable to update order status.",
                );
              }
            }}
          />
        </div>
      ),
    },
  ];

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
        {actionError && <div className="mb-4"><FormError message={actionError} /></div>}
        {actionMessage && (
          <p className="mb-4 text-sm text-status-success" role="status">
            {actionMessage}
          </p>
        )}
        {visibleOrders.length > 0 ? (
          <DashboardTable
            columns={columns}
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