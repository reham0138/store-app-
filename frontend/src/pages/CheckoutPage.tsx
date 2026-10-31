import { useState } from "react";

import { useNavigate, Link } from "react-router-dom";

import { ArrowLeft, MapPin, CreditCard } from "lucide-react";

import { useCart } from "../shared/contexts/CartContext";

import { formatPrice } from "../shared/utils/pricing";

import type {
  PaymentMethod,
  ShippingAddress,
  Order,
} from "../shared/types/order";

import { saveOrder } from "../shared/utils/orderStorage";

export default function CheckoutPage() {
  const navigate = useNavigate();

  const {
    items,
    subtotal,
    deliveryFee,
    total,
    clearCart,
  } = useCart();

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("cash");

  const [address, setAddress] = useState<ShippingAddress>({
    fullName: "",
    phone: "",
    city: "",
    street: "",
    building: "",
    notes: "",
  });

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    setAddress((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (items.length === 0) {
      navigate("/cart");
      return;
    }

    const order: Order = {
      id: `ORD-${Date.now()}`,
      items: items.map((item) => ({
        ...item,
        product: { ...item.product },
      })),
      shippingAddress: { ...address },
      paymentMethod,
      subtotal,
      deliveryFee,
      total,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    saveOrder(order);

    clearCart();

    navigate("/order-success", {
      state: { orderId: order.id },
    });
  };

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-brand-navy">
          Your cart is empty
        </h1>

        <Link
          to="/"
          className="mt-6 inline-block rounded-lg bg-brand-navy px-6 py-3 text-white"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">

      <Link
        to="/cart"
        className="inline-flex items-center gap-2 text-sm text-text-slate hover:text-brand-navy"
      >
        <ArrowLeft size={16} />
        Back to Cart
      </Link>

      <header className="mb-8 mt-5">
        <h1 className="text-3xl font-semibold text-brand-navy">
          Checkout
        </h1>

        <p className="mt-2 text-text-slate">
          Complete your shipping and payment information.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="grid items-start gap-8 lg:grid-cols-[1fr_380px]"
      >

        {/* Checkout Form */}
        <div className="grid gap-6">

          {/* Shipping Information */}
          <section className="rounded-xl border border-border-subtle bg-surface-white p-5 sm:p-7">

            <div className="mb-6 flex items-center gap-3">
              <MapPin className="text-brand-gold" />

              <h2 className="text-xl font-semibold text-brand-navy">
                Shipping Information
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">

              <div className="grid gap-2 sm:col-span-2">
                <label htmlFor="fullName" className="text-sm font-medium">
                  Full Name *
                </label>

                <input
                  id="fullName"
                  name="fullName"
                  value={address.fullName}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                  placeholder="Enter your full name"
                  className="input"
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Phone Number *
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={address.phone}
                  onChange={handleChange}
                  required
                  autoComplete="tel"
                  placeholder="Enter your phone number"
                  className="input"
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="city" className="text-sm font-medium">
                  City *
                </label>

                <input
                  id="city"
                  name="city"
                  value={address.city}
                  onChange={handleChange}
                  required
                  autoComplete="address-level2"
                  placeholder="Enter your city"
                  className="input"
                />
              </div>

              <div className="grid gap-2 sm:col-span-2">
                <label htmlFor="street" className="text-sm font-medium">
                  Street Address *
                </label>

                <input
                  id="street"
                  name="street"
                  value={address.street}
                  onChange={handleChange}
                  required
                  autoComplete="street-address"
                  placeholder="Street and area"
                  className="input"
                />
              </div>

              <div className="grid gap-2 sm:col-span-2">
                <label htmlFor="building" className="text-sm font-medium">
                  Building / Apartment
                </label>

                <input
                  id="building"
                  name="building"
                  value={address.building}
                  onChange={handleChange}
                  placeholder="Building number, floor, apartment"
                  className="input"
                />
              </div>

              <div className="grid gap-2 sm:col-span-2">
                <label htmlFor="notes" className="text-sm font-medium">
                  Delivery Notes
                </label>

                <textarea
                  id="notes"
                  name="notes"
                  value={address.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Additional instructions (optional)"
                  className="input resize-y"
                />
              </div>

            </div>
          </section>

          {/* Payment Method */}
          <section className="rounded-xl border border-border-subtle bg-surface-white p-5 sm:p-7">

            <div className="mb-5 flex items-center gap-3">
              <CreditCard className="text-brand-gold" />

              <h2 className="text-xl font-semibold text-brand-navy">
                Payment Method
              </h2>
            </div>

            <div className="grid gap-3">

              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border-subtle p-4 hover:bg-surface-cream">
                <input
                  type="radio"
                  name="payment"
                  value="cash"
                  checked={paymentMethod === "cash"}
                  onChange={() => setPaymentMethod("cash")}
                />

                <div>
                  <p className="font-medium text-brand-navy">
                    Cash on Delivery
                  </p>

                  <p className="text-sm text-text-slate">
                    Pay when your order arrives.
                  </p>
                </div>
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-border-subtle p-4 hover:bg-surface-cream">
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                />

                <div>
                  <p className="font-medium text-brand-navy">
                    Credit / Debit Card
                  </p>

                  <p className="text-sm text-text-slate">
                    Card payment demo option.
                  </p>
                </div>
              </label>

            </div>
          </section>

        </div>

        {/* Order Review */}
        <aside className="rounded-xl border border-border-subtle bg-surface-white p-5">

          <h2 className="text-xl font-semibold text-brand-navy">
            Order Review
          </h2>

          <div className="mt-5 grid gap-4">

            {items.map((item) => (
              <div
                key={item.product.id}
                className="flex justify-between gap-3 text-sm"
              >
                <span className="text-text-slate">
                  {item.product.title} × {item.quantity}
                </span>

                <span className="shrink-0 font-medium">
                  {formatPrice(
                    item.product.price *
                    (1 - item.product.discountPercentage / 100) *
                    item.quantity
                  )}
                </span>
              </div>
            ))}

            <div className="border-t border-border-subtle pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-text-slate">Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>

              <div className="mt-3 flex justify-between text-sm">
                <span className="text-text-slate">Delivery</span>
                <span>{formatPrice(deliveryFee)}</span>
              </div>

              <div className="mt-4 flex justify-between border-t border-border-subtle pt-4 font-semibold text-brand-navy">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-lg bg-brand-navy px-4 py-3 font-medium text-white transition hover:bg-brand-navy/90"
            >
              Place Order
            </button>

            <p className="text-center text-xs text-text-slate">
              By placing your order, you confirm your information is correct.
            </p>

          </div>
        </aside>

      </form>
    </section>
  );
}