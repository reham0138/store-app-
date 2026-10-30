
import {
  GitBranch,
  House,
  ShoppingCart,
  Package,
} from "lucide-react";

import { Link } from "react-router-dom";
import { useCart } from "../contexts/CartContext";
import { ShoppingBag } from "lucide-react";

export default function NavBar() {
  const { totalItems } = useCart();

  return (
    <header className="border-b border-border-subtle bg-surface-white">
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        <Link
          to="/"
          className="flex min-w-0 items-center gap-3"
          aria-label="The Crown & Anchor home"
        >
          <img
            src="/brand/logo/the-crown-anchor-logo-black.png"
            alt=""
            className="size-12 shrink-0 object-contain"
          />

          <span className="min-w-0">
            <span className="block truncate font-semibold text-brand-navy">
              The Crown &amp; Anchor
            </span>

            <span className="hidden text-xs tracking-[0.16em] text-text-slate sm:block">
              MORE THAN JUST A STORE
            </span>
          </span>
        </Link>

        <nav
          aria-label="Main navigation"
          className="flex items-center gap-1"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-brand-navy hover:bg-surface-cream sm:px-3"
          >
            <House size={18} />
            <span className="hidden sm:inline">Home</span>
          </Link>

          <Link
            to="/branch-test"
            className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-brand-navy hover:bg-surface-cream sm:px-3"
          >
            <GitBranch size={18} />
            <span className="hidden sm:inline">Branch</span>
          </Link>

          <Link
            to="/cart"
            aria-label={`Shopping cart, ${totalItems} items`}
            className="relative inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-brand-navy hover:bg-surface-cream sm:px-3"
          >
            <ShoppingCart size={20} />
            <span className="hidden sm:inline">Cart</span>

            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-brand-gold text-xs font-bold text-brand-navy">
                {totalItems}
              </span>
            )}
          </Link>
<Link to="/products" className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-brand-navy hover:bg-surface-cream sm:px-3">

  <ShoppingBag size={18} />
  <span>Products</span>
                      </Link>
          <Link
            to="/orders"
            className="inline-flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-brand-navy hover:bg-surface-cream sm:px-3"
          >
            <Package size={18} />
            <span className="hidden sm:inline">Orders</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
