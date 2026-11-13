import { Link } from "react-router-dom";

import {
  formatPrice,
} from "../utils/pricing";

interface CartSummaryProps {
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export default function CartSummary({
  subtotal,
  deliveryFee,
  total,
}: CartSummaryProps) {
  return (
    <section className="h-fit rounded-xl border border-border-subtle bg-surface-white p-5">

      <h2 className="text-lg font-semibold text-brand-navy">
        Order Summary
      </h2>

      <div className="mt-5 grid gap-4">

        <div className="flex justify-between text-sm">
          <span className="text-text-slate">Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-text-slate">Delivery Fee</span>
          <span>{formatPrice(deliveryFee)}</span>
        </div>

        <div className="border-t border-border-subtle pt-4">
          <div className="flex justify-between font-semibold text-brand-navy">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        <Link
          to="/checkout"
          className="w-full rounded-lg bg-brand-navy px-4 py-3 text-center font-medium text-white transition hover:bg-brand-navy/90"
        >
          Proceed to Checkout
        </Link>

        <Link
          to="/"
          className="text-center text-sm text-text-slate hover:text-brand-navy"
        >
          Continue Shopping
        </Link>

      </div>
    </section>
  );
}