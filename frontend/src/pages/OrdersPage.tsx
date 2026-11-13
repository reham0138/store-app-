import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Package } from "lucide-react";

import { ordersService } from "../shared/services/orders.service";
import type { Order } from "../shared/types/order";
import { normalizeError } from "../shared/api/errors";

import { formatPrice } from "../shared/utils/pricing";

import OrderStatus from "../shared/components/OrderStatus";

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    ordersService
      .getOrders()
      .then((result) => {
        if (isMounted) setOrders(result);
      })
      .catch((err) => {
        if (isMounted) setError(normalizeError(err, "Couldn't load your orders.").message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

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
            onClick={() => window.location.reload()}
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
                    {order.id}
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

        </div>
      )}

    </section>
  );
}