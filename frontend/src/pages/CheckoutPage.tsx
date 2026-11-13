import { useState } from "react";

import { useNavigate, Link } from "react-router-dom";

import { ArrowLeft, MapPin, CreditCard } from "lucide-react";

import { useCart } from "../shared/hooks/useCart";

import {
  formatPrice,
  getProductPrice,
} from "../shared/utils/pricing";
import { useBranch } from "../shared/contexts/useBranch";
import {
  MAX_NAME_LENGTH,
  sanitizePhoneInput,
  validatePhone,
} from "../shared/utils/authValidation";

import type {
  PaymentMethod,
  ShippingAddress,
} from "../shared/types/order";

import { ordersService } from "../shared/services/orders.service";
import { normalizeError } from "../shared/api/errors";

interface CheckoutFieldErrors {
  fullName?: string;
  phone?: string;
  city?: string;
  street?: string;
}

export default function CheckoutPage() {
  const navigate = useNavigate();
  const {
    selectedBranch,
    isLoading: branchesLoading,
    error: branchError,
  } = useBranch();

  const {
    items,
    subtotal,
    deliveryFee,
    total,
    clearCart,
    cartNotice,
    dismissCartNotice,
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
  const [fieldErrors, setFieldErrors] = useState<CheckoutFieldErrors>({});
  const [saveError, setSaveError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    setAddress((previous) => ({
      ...previous,
      [name]: value,
    }));
    setFieldErrors((previous) => ({
      ...previous,
      [name]: undefined,
    }));
  };

  const handlePhoneChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const phone = sanitizePhoneInput(event.target.value);
    setAddress((previous) => ({ ...previous, phone }));
    setFieldErrors((previous) => ({ ...previous, phone: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    if (branchesLoading || branchError || !selectedBranch) return;

    if (selectedBranch.operationalStatus === "closed") {
      setSaveError(
        `Branch "${selectedBranch.name}" is currently closed and cannot take orders.`,
      );
      return;
    }

    const nextErrors: CheckoutFieldErrors = {
      fullName:
        address.fullName.trim().length < 2
          ? "Enter your full name (at least 2 characters)."
          : address.fullName.trim().length > MAX_NAME_LENGTH
            ? `Name must be ${MAX_NAME_LENGTH} characters or fewer.`
            : undefined,
      phone: validatePhone(address.phone),
      city: address.city.trim() ? undefined : "Enter your city.",
      street: address.street.trim() ? undefined : "Enter your street address.",
    };
    setFieldErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;

    if (items.length === 0) {
      navigate("/cart");
      return;
    }

    setSubmitting(true);
    setSaveError("");
    try {
      const order = await ordersService.createOrder({
        branchId: selectedBranch.id,
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        shippingAddress: {
          ...address,
          fullName: address.fullName.trim(),
          phone: address.phone.trim(),
          city: address.city.trim(),
          street: address.street.trim(),
          building: address.building?.trim(),
          notes: address.notes?.trim(),
        },
        paymentMethod,
      });

      clearCart();
      navigate("/order-success", {
        state: { orderId: order.id },
      });
    } catch (error) {
      const normalized = normalizeError(error, "We couldn’t place your order. Please try again.");
      if (normalized.code === "INSUFFICIENT_STOCK") {
        // Tell the user which items failed and refresh cart quantities.
        const details = Array.isArray(normalized.details)
          ? (normalized.details as { productId: string; available: number }[])
          : [];
        if (details.length > 0) {
          const names = details
            .map((d) => items.find((i) => i.product.id === d.productId)?.product.title ?? d.productId)
            .join(", ");
          setSaveError(
            `Not enough stock for: ${names}. Your cart was updated — please review quantities and try again.`,
          );
        } else {
          setSaveError(normalized.message);
        }
        // Refresh product data so the cart re-caps quantities at real stock.
        window.dispatchEvent(new Event("products-updated"));
      } else {
        setSaveError(normalized.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

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
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-brand-navy">
          Your cart is empty
        </h1>

        <Link
          to="/products"
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

      {saveError && (
        <p className="mb-6 rounded-lg border border-status-error/30 bg-status-error/10 p-4 text-sm text-status-error" role="alert">
          {saveError}
        </p>
      )}

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

      <form
        onSubmit={handleSubmit}
        noValidate
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
                  maxLength={MAX_NAME_LENGTH}
                  aria-invalid={fieldErrors.fullName ? true : undefined}
                  aria-describedby={fieldErrors.fullName ? "fullName-error" : undefined}
                  autoComplete="name"
                  placeholder="Enter your full name"
                  className="input"
                />
                {fieldErrors.fullName && (
                  <p id="fullName-error" className="text-sm text-status-error" role="alert">
                    {fieldErrors.fullName}
                  </p>
                )}
              </div>

              <div className="grid gap-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Phone Number *
                </label>

                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="tel"
                  pattern="[+]?[0-9][0-9 ()-]*[0-9]"
                  title="Use 7 to 15 digits; +, spaces, parentheses, and hyphens are allowed."
                  value={address.phone}
                  onChange={handlePhoneChange}
                  aria-invalid={fieldErrors.phone ? true : undefined}
                  aria-describedby={fieldErrors.phone ? "phone-error" : undefined}
                  autoComplete="tel"
                  placeholder="Enter your phone number"
                  className="input"
                />
                {fieldErrors.phone && (
                  <p id="phone-error" className="text-sm text-status-error" role="alert">
                    {fieldErrors.phone}
                  </p>
                )}
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
                  maxLength={100}
                  aria-invalid={fieldErrors.city ? true : undefined}
                  aria-describedby={fieldErrors.city ? "city-error" : undefined}
                  autoComplete="address-level2"
                  placeholder="Enter your city"
                  className="input"
                />
                {fieldErrors.city && (
                  <p id="city-error" className="text-sm text-status-error" role="alert">
                    {fieldErrors.city}
                  </p>
                )}
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
                  maxLength={200}
                  aria-invalid={fieldErrors.street ? true : undefined}
                  aria-describedby={fieldErrors.street ? "street-error" : undefined}
                  autoComplete="street-address"
                  placeholder="Street and area"
                  className="input"
                />
                {fieldErrors.street && (
                  <p id="street-error" className="text-sm text-status-error" role="alert">
                    {fieldErrors.street}
                  </p>
                )}
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
                  maxLength={100}
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
                  maxLength={500}
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
          {selectedBranch && (
            <p className="mt-2 text-sm text-text-slate">
              Fulfilled by {selectedBranch.name}
            </p>
          )}

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
                    getProductPrice(item.product, selectedBranch?.id) *
                    item.quantity,
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
              disabled={submitting}
              className="mt-2 w-full rounded-lg bg-brand-navy px-4 py-3 font-medium text-white transition hover:bg-brand-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Placing order…" : "Place Order"}
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