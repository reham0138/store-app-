import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { CheckCircle2, Package } from "lucide-react";

import { ordersService } from "../shared/services/orders.service";
import type { Order } from "../shared/types/order";

import { formatPrice } from "../shared/utils/pricing";
import { shortOrderId } from "../shared/utils/orderId";

export default function OrderSuccessPage() {
  const location = useLocation();

  const state = location.state as { orderId?: string } | null;
  const orderId = state?.orderId;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) return;
    let isMounted = true;
    ordersService
      .getOrder(orderId)
      .then((found) => {
        if (isMounted) setOrder(found);
      })
      .catch(() => {
        if (isMounted) setError("We couldn't load your order.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [orderId]);

  if (loading) {
    return (
      <p className="px-4 py-16 text-center text-text-slate" role="status">
        Loading your order…
      </p>
    );
  }

  if (error || !order) {
    return (
      <section className="mx-auto max-w-2xl px-4 py-20 text-center">

        <h1 className="text-2xl font-semibold text-brand-navy">
          Order not found
        </h1>

        <Link
          to="/orders"
          className="mt-6 inline-block text-brand-navy underline"
        >
          View My Orders
        </Link>

      </section>
    );
  }

  return (
    <section className="mx-auto flex min-h-[65vh] max-w-2xl flex-col items-center justify-center px-4 py-12 text-center">

      <div className="rounded-full bg-status-success/10 p-6">
        <CheckCircle2
          size={52}
          className="text-status-success"
        />
      </div>

      <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-brand-gold">
        Order Confirmed
      </p>

      <h1 className="mt-3 text-3xl font-semibold text-brand-navy">
        Thank You for Your Order!
      </h1>

      <p className="mt-3 max-w-md text-text-slate">
        Your order has been placed successfully. You can track its progress from your orders page.
      </p>

      <div className="mt-8 w-full rounded-xl border border-border-subtle bg-surface-white p-6 text-left">

        <div className="flex items-center gap-3">
          <Package className="text-brand-gold" />

          <div>
            <p className="text-xs text-text-slate">
              Order Number
            </p>

            <p className="font-semibold text-brand-navy">
              {shortOrderId(order.id)}
            </p>
            <p className="text-xs text-text-slate" title={order.id}>
              {order.id}
            </p>
          </div>
        </div>

        <div className="mt-5 flex justify-between border-t border-border-subtle pt-4">
          <span className="text-sm text-text-slate">
            Total Paid / Due
          </span>

          <span className="font-semibold text-brand-navy">
            {formatPrice(order.total)}
          </span>
        </div>

        <p className="mt-3 text-xs text-text-slate">
          Payment method: {order.paymentMethod === "cash"
            ? "Cash on Delivery"
            : "Card (Demo)"}
        </p>
        {order.branch && (
          <p className="mt-2 text-xs text-text-slate">
            Fulfilled by: {order.branch.name}
          </p>
        )}

      </div>

      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">

        <Link
          to="/orders"
          className="rounded-lg bg-brand-navy px-6 py-3 font-medium text-white hover:bg-brand-navy/90"
        >
          View My Orders
        </Link>

        <Link
          to="/"
          className="rounded-lg border border-border-subtle px-6 py-3 font-medium text-brand-navy hover:bg-surface-white"
        >
          Continue Shopping
        </Link>

      </div>

    </section>
  );
}