import { Link } from "react-router-dom";

import { Package } from "lucide-react";

import { getOrders } from "../shared/utils/orderStorage";

import { formatPrice } from "../shared/utils/pricing";

import OrderStatus from "../shared/components/OrderStatus";

export default function OrdersPage() {
  const orders = getOrders();

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

      {orders.length === 0 ? (

        <div className="rounded-xl border border-border-subtle bg-surface-white px-6 py-16 text-center">

          <Package
            size={40}
            className="mx-auto text-brand-navy"
          />

          <h2 className="mt-5 text-xl font-semibold text-brand-navy">
            No orders yet
          </h2>

          <p className="mt-2 text-sm text-text-slate">
            Your orders will appear here after checkout.
          </p>

          <Link
            to="/"
            className="mt-6 inline-block rounded-lg bg-brand-navy px-6 py-3 text-white"
          >
            Start Shopping
          </Link>

        </div>

      ) : (

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