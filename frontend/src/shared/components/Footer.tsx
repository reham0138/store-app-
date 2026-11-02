import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="w-full bg-brand-navy text-surface-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 border-b border-surface-white/20 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/brand/logo/the-crown-anchor-logo-white.png"
              alt=""
              className="size-14 shrink-0 object-contain"
            />
            <div>
              <p className="font-semibold">The Crown &amp; Anchor</p>
              <p className="mt-1 text-xs tracking-[0.16em] text-surface-white/75">
                MORE THAN JUST A STORE
              </p>
            </div>
          </div>

          <nav aria-label="Footer navigation" className="flex flex-wrap gap-2">
            <Link
              to="/products"
              className="rounded-lg px-3 py-2 text-sm text-surface-white transition-colors hover:bg-surface-white/10"
            >
              Products
            </Link>
            <Link
              to="/cart"
              className="rounded-lg px-3 py-2 text-sm text-surface-white transition-colors hover:bg-surface-white/10"
            >
              Cart
            </Link>
            <Link
              to="/orders"
              className="rounded-lg px-3 py-2 text-sm text-surface-white transition-colors hover:bg-surface-white/10"
            >
              Orders
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-surface-white transition-colors hover:bg-surface-white/10"
            >
              Home
              <ArrowUpRight aria-hidden="true" size={16} />
            </Link>
          </nav>
        </div>

        <p className="text-sm text-surface-white/75">
          &copy; {new Date().getFullYear()} The Crown &amp; Anchor
        </p>
      </div>
    </footer>
  );
}