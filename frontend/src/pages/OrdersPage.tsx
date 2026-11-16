import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Package } from "lucide-react";

import { ordersService } from "../shared/services/orders.service";
import type { OrderQuery } from "../shared/services/orders.service";
import type { Order, OrderStatus as OrderStatusValue } from "../shared/types/order";
import { normalizeError } from "../shared/api/errors";

import { formatPrice } from "../shared/utils/pricing";
import { shortOrderId } from "../shared/utils/orderId";

import OrderStatus from "../shared/components/OrderStatus";
import { Select } from "../shared/components/Select";
import { Label } from "../shared/components/Label";

const PAGE_SIZE = 10;

const STATUS_OPTIONS: { value: "" | OrderStatusValue; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "shipped", label: "Shipped" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"" | OrderStatusValue>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const query: OrderQuery = { page, limit: PAGE_SIZE };
      if (status) query.status = status;
      const data = await ordersService.list(query);
      setOrders(data.items);
      setTotal(data.total);
      setError("");
    } catch (err) {
      setError(normalizeError(err, "Couldn't load your orders.").message);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    queueMicrotask(() => void loadOrders());
  }, [loadOrders]);

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">

      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold">
          Account
        </p>

        <h1 className="mt-2 text-3xl font-semibold text-brand-navy">
          My Orders
        </h1>

        <p className="mt-2 text-text-slate">
          Track and review your previous orders.
        </p>
      </header>

      <div className="mb-6 max-w-xs">
        <Label label="Status">
          <Select
            value={status}
            options={STATUS_OPTIONS}
            onChange={(event) => {
              setStatus(event.target.value as "" | OrderStatusValue);
              setPage(1);
            }}
          />
        </Label>
      </div>

      {loading && (
        <p className="py-16 text-center text-sm text-text-slate" role="status">
          Loading your orders…
        </p>
      )}

      {!loading && error && (
        <div className="rounded-xl border border-status-error/20 bg-surface-white px-6 py-12 text-center">
          <p className="font-medium text-status-error">{error}</p>
          <button
            type="button"
            onClick={() => void loadOrders()}
            className="mt-4 rounded-lg bg-brand-navy px-5 py-2 text-sm text-white"
          >
            Try Again
          </button>
        </div>
      )}

      {!loading && !error && orders.length === 0 && (

        <div className="rounded-xl border border-border-subtle bg-surface-white px-6 py-16 text-center">

          <Package
            size={40}
            className="mx-auto text-brand-navy"
          />

          <h2 className="mt-5 text-xl font-semibold text-brand-navy">
            No orders yet
          </h2>

          <p className="mt-2 text-sm text-text-slate">
            Orders you place will appear here and sync across your devices.
          </p>

          <Link
            to="/"
            className="mt-6 inline-block rounded-lg bg-brand-navy px-6 py-3 text-white"
          >
            Start Shopping
          </Link>

        </div>

      )}

      {!loading && !error && orders.length > 0 && (
        <div className="grid gap-4">

          {orders.map((order) => (

            <article
              key={order.id}
              className="rounded-xl border border-border-subtle bg-surface-white p-5"
            >

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                <div>
                  <p className="text-sm text-text-slate">
                    Order Number
                  </p>

                  <h2 className="mt-1 font-semibold text-brand-navy">
                    {shortOrderId(order.id)}
                    <span className="ms-2 text-xs font-normal text-text-slate" title={order.id}>
                      {order.id}
                    </span>
                  </h2>
                </div>

                <OrderStatus status={order.status} />

              </div>

              <div className="mt-5 grid gap-3 border-t border-border-subtle pt-4 sm:grid-cols-3">

                <div>
                  <p className="text-xs text-text-slate">
                    Order Date
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-text-slate">
                    Items
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {order.items.reduce(
                      (sum, item) => sum + item.quantity,
                      0
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-text-slate">
                    Total
                  </p>

                  <p className="mt-1 text-sm font-semibold text-brand-navy">
                    {formatPrice(order.total)}
                  </p>
                </div>

              </div>

              <div className="mt-4 border-t border-border-subtle pt-4">
                {order.branch && (
                  <p className="text-sm text-text-slate">
                    Fulfilled by: {order.branch.name}
                  </p>
                )}

                <p className="text-sm text-text-slate">
                  Deliver to: {order.shippingAddress.city}
                </p>

                <p className="mt-1 text-sm text-text-slate">
                  Payment: {order.paymentMethod === "cash"
                    ? "Cash on Delivery"
                    : "Card (Demo)"}
                </p>
              </div>

            </article>

          ))}

          {totalPages > 1 && (
            <nav className="mt-4 flex items-center justify-center gap-3" aria-label="Order pages">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-border-subtle bg-surface-white px-4 py-2 text-sm font-medium text-brand-navy disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-text-slate">
                Page {page} of {totalPages}
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

        </div>
      )}

    </section>
  );
}
