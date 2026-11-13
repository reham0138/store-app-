import { ClipboardList } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  DashboardCard,
  DashboardEmptyState,
  DashboardPageHeader,
  DashboardTable,
} from "../shared/components/dashboard";
import type { DashboardTableColumn } from "../shared/components/dashboard";
import OrderStatus from "../shared/components/OrderStatus";
import { formatPrice } from "../shared/utils/pricing";
import type { Order, OrderStatus as OrderStatusValue } from "../shared/types/order";
import { ORDER_STATUS_FLOW } from "../shared/types/order";
import { ordersService } from "../shared/services/orders.service";
import { normalizeError } from "../shared/api/errors";
import { Select } from "../shared/components/Select";
import { FormError } from "../shared/components/FormError";
import { Label } from "../shared/components/Label";
import { shortOrderId } from "../shared/utils/orderId";

interface DashboardOrdersPageProps {
  branchScoped?: boolean;
}

const PAGE_SIZE = 20;

const statusLabels: Record<OrderStatusValue, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const STATUS_FILTER_OPTIONS: { value: "" | OrderStatusValue; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

const orderColumns: DashboardTableColumn<Order>[] = [
  {
    key: "id",
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

export default function DashboardOrdersPage({
  branchScoped = false,
}: DashboardOrdersPageProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"" | OrderStatusValue>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await ordersService.list({
        status: statusFilter || undefined,
        page,
        limit: PAGE_SIZE,
      });
      setOrders(data.items);
      setTotal(data.total);
      setError("");
    } catch (loadError) {
      setError(normalizeError(loadError, "Failed to load orders.").message);
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    queueMicrotask(() => void loadOrders());
  }, [loadOrders]);

  async function handleStatusChange(order: Order, status: OrderStatusValue) {
    setActionError("");
    setActionMessage("");
    try {
      await ordersService.updateOrderStatus(order.id, status);
      setActionMessage(`Order ${shortOrderId(order.id)} updated to ${statusLabels[status]}.`);
      await loadOrders();
    } catch (updateError) {
      const normalized = normalizeError(updateError, "Unable to update order status.");
      setActionError(normalized.message);
      if (normalized.code === "INVALID_TRANSITION") {
        // Status changed elsewhere — refresh so the dropdown shows reality.
        await loadOrders();
      }
    }
  }

  const columns: DashboardTableColumn<Order>[] = [
    ...orderColumns,
    {
      key: "status",
      header: "Status",
      render: (order) => {
        const nextStatuses = ORDER_STATUS_FLOW[order.status];
        return (
          <div className="flex min-w-40 items-center gap-2">
            <OrderStatus status={order.status} />
            {nextStatuses.length > 0 ? (
              <Select
                aria-label={`Update status for order ${order.id}`}
                value={order.status}
                options={[
                  { value: order.status, label: `${statusLabels[order.status]} (current)` },
                  ...nextStatuses.map((status) => ({
                    value: status,
                    label: `Move to ${statusLabels[status]}`,
                  })),
                ]}
                onChange={(event) => {
                  const status = event.currentTarget.value as OrderStatusValue;
                  if (status !== order.status) void handleStatusChange(order, status);
                }}
              />
            ) : (
              <span className="text-xs text-text-slate">Final status</span>
            )}
          </div>
        );
      },
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
            : "Review all orders across the store."
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
        <div className="mb-6 max-w-xs">
          <Label label="Status">
            <Select
              value={statusFilter}
              options={STATUS_FILTER_OPTIONS}
              onChange={(event) => {
                setStatusFilter(event.target.value as "" | OrderStatusValue);
                setPage(1);
              }}
            />
          </Label>
        </div>

        {isLoading && (
          <p className="py-12 text-center text-sm text-text-slate">
            Loading orders...
          </p>
        )}
        {!isLoading && error && (
          <div className="py-8 text-center">
            <p className="text-sm text-status-error">{error}</p>
            <button
              type="button"
              onClick={() => void loadOrders()}
              className="mt-3 rounded-lg bg-brand-navy px-4 py-2 text-sm text-white"
            >
              Try Again
            </button>
          </div>
        )}
        {actionError && <div className="mb-4"><FormError message={actionError} /></div>}
        {actionMessage && (
          <p className="mb-4 text-sm text-status-success" role="status">
            {actionMessage}
          </p>
        )}
        {!isLoading && !error && orders.length > 0 && (
          <>
            <DashboardTable
              columns={columns}
              rows={orders}
              getRowKey={(order) => order.id}
            />
            {totalPages > 1 && (
              <nav className="mt-6 flex items-center justify-center gap-3" aria-label="Order pages">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg border border-border-subtle bg-surface-white px-4 py-2 text-sm font-medium text-brand-navy disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="text-sm text-text-slate">
                  Page {page} of {totalPages} · {total} orders
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg border border-border-subtle bg-surface-white px-4 py-2 text-sm font-medium text-brand-navy disabled:opacity-50"
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}
        {!isLoading && !error && orders.length === 0 && (
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
