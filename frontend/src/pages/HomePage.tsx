import {
  ArrowRight,
  ClipboardList,
  CreditCard,
  ShoppingBag,
  ShoppingCart,
} from "lucide-react";
import { Link } from "react-router-dom";

const shoppingSteps = [
  {
    number: "01",
    title: "Explore",
    description: "Find quality picks for the things you use every day.",
    icon: ShoppingBag,
    to: "/products",
    link: "Browse products",
  },
  {
    number: "02",
    title: "Review your cart",
    description: "Check your selections and adjust quantities before you buy.",
    icon: ShoppingCart,
    to: "/cart",
    link: "View your cart",
  },
  {
    number: "03",
    title: "Checkout",
    description:
      "Add delivery and payment details to place your order, then track its progress.",
    icon: CreditCard,
    to: "/checkout",
    link: "Go to checkout",
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="bg-brand-navy px-4 py-16 text-white sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
              The Crown &amp; Anchor
            </p>
            <h1 className="mt-4 max-w-2xl text-4xl font-semibold leading-tight sm:text-5xl">
              Everyday essentials, carefully chosen.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/75">
              Discover quality products, find what you need, and shop with
              confidence from browsing to delivery.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/products"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-gold px-5 py-3 font-semibold text-brand-navy transition hover:bg-brand-gold/90"
              >
                Shop products
                <ArrowRight aria-hidden="true" size={18} />
              </Link>
              <Link
                to="/orders"
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-5 py-3 font-medium text-white transition hover:bg-white/10"
              >
                <ClipboardList aria-hidden="true" size={18} />
                Track an order
              </Link>
            </div>
          </div>

          <div className="hidden justify-center lg:flex" aria-hidden="true">
            <div className="flex size-64 items-center justify-center rounded-full border border-brand-gold/40 bg-white/5">
              <div className="flex size-48 items-center justify-center rounded-full border border-brand-gold/60 bg-white/5">
                <ShoppingBag className="text-brand-gold" size={80} strokeWidth={1.2} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <header className="mb-8 max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-gold">
            A simple shopping journey
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-brand-navy sm:text-3xl">
            From discovery to delivery
          </h2>
          <p className="mt-3 leading-6 text-text-slate">
            Start with the catalog, review your cart, and complete checkout
            whenever you are ready.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {shoppingSteps.map(({ number, title, description, icon: Icon, to, link }) => (
            <article
              key={number}
              className="flex flex-col rounded-xl border border-border-subtle bg-surface-white p-6"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold tracking-widest text-brand-gold">
                  {number}
                </span>
                <Icon aria-hidden="true" className="text-brand-navy" size={22} />
              </div>
              <h3 className="mt-5 text-lg font-semibold text-brand-navy">
                {title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-text-slate">
                {description}
              </p>
              <Link
                to={to}
                className="mt-5 inline-flex w-fit items-center gap-2 text-sm font-semibold text-brand-navy hover:text-brand-gold"
              >
                {link}
                <ArrowRight aria-hidden="true" size={16} />
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
