import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";

import { useCart } from "../contexts/CartContext";

import CartItem from "../components/CartItem";
import CartSummary from "../components/CartSummary";
import { useBranch } from "../contexts/useBranch";

export default function CartPage() {
  const { isLoading: branchesLoading, selectedBranch, error: branchError } =
    useBranch();
  const {
    items,
    subtotal,
    deliveryFee,
    total,
    updateQuantity,
    removeFromCart,
    cartNotice,
    dismissCartNotice,
  } = useCart();

  if (branchesLoading) {
    return (
      <p className="px-4 py-16 text-center text-text-slate" role="status">
        Loading branch inventory...
      </p>
    );
  }

  if (branchError || !selectedBranch) {
    return (
      <p className="px-4 py-16 text-center text-status-error" role="alert">
        {branchError ?? "No branches are currently available."}
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
        {cartNotice && (
          <div
            className="mb-6 flex w-full items-start justify-between gap-4 rounded-lg border border-status-warning/30 bg-status-warning/10 p-4 text-left text-sm text-text-main"
            role="status"
          >
            <span>{cartNotice}</span>
            <button
              type="button"
              onClick={dismissCartNotice}
              className="font-semibold text-brand-navy underline"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="rounded-full bg-brand-navy/5 p-6">
          <ShoppingBag size={40} className="text-brand-navy" />
        </div>

        <h1 className="mt-6 text-2xl font-semibold text-brand-navy">
          Your cart is empty
        </h1>

        <p className="mt-2 text-text-slate">
          Looks like you haven't added anything to your cart yet.
        </p>

        <Link
          to="/products"
          className="mt-6 rounded-lg bg-brand-navy px-6 py-3 font-medium text-white hover:bg-brand-navy/90"
        >
          Explore Products
        </Link>

      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-gold">
          Shopping
        </p>

        <h1 className="mt-2 text-3xl font-semibold text-brand-navy">
          Shopping Cart
        </h1>

        <p className="mt-2 text-sm text-text-slate">
          You have {items.length} different products in your cart.
        </p>
      </header>

      {cartNotice && (
        <div
          className="mb-6 flex items-start justify-between gap-4 rounded-lg border border-status-warning/30 bg-status-warning/10 p-4 text-sm text-text-main"
          role="status"
        >
          <span>{cartNotice}</span>
          <button
            type="button"
            onClick={dismissCartNotice}
            className="shrink-0 font-semibold text-brand-navy underline"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_350px]">

        {/* Cart Items */}
        <div className="grid gap-4">

          {items.map((item) => (
            <CartItem
              key={item.product.id}
              item={item}
              onUpdateQuantity={updateQuantity}
              onRemove={removeFromCart}
            />
          ))}

        </div>

        {/* Summary */}
        <CartSummary
          subtotal={subtotal}
          deliveryFee={deliveryFee}
          total={total}
        />

      </div>
    </section>
  );
}