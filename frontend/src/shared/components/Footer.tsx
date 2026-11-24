import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Footer() {
  const { user } = useAuth();

  return (
    <footer className="w-full bg-brand-navy text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-10 sm:px-8 lg:px-12">
        <div className="grid gap-8 border-b border-surface-white/20 pb-8 sm:grid-cols-[1fr_auto] sm:items-start">
          <div className="flex items-center gap-4">
            <img
              src="/brand/logo/the-crown-anchor-logo-white.png"
              alt=""
              className="size-14 shrink-0 object-contain"
            />
            <div>
              <p className="font-semibold">The Crown &amp; Anchor</p>
              <p className="mt-1 text-xs tracking-[0.16em] text-white/75">
                MORE THAN JUST A STORE
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-10 gap-y-7 sm:grid-cols-3">
            <nav aria-label="Shop links" className="grid content-start gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-gold">
                Shop
              </h2>
              <Link
                to="/products"
                className="text-sm text-white/80 transition-colors hover:text-white"
              >
                Products
              </Link>
              <Link
                to="/branches"
                className="text-sm text-white/80 transition-colors hover:text-white"
              >
                Branch locations
              </Link>
              <Link
                to="/cart"
                className="text-sm text-white/80 transition-colors hover:text-white"
              >
                Cart
              </Link>
            </nav>

            <nav aria-label="Account links" className="grid content-start gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-gold">
                Your account
              </h2>
              {user ? (
                <Link
                  to="/orders"
                  className="text-sm text-white/80 transition-colors hover:text-white"
                >
                  Orders
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="text-sm text-white/80 transition-colors hover:text-white"
                >
                  Sign in
                </Link>
              )}
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm text-white/80 transition-colors hover:text-white"
              >
                Home
                <ArrowUpRight aria-hidden="true" size={15} />
              </Link>
            </nav>
          </div>
        </div>

        <p className="text-xs text-white/65">
          &copy; {new Date().getFullYear()} The Crown &amp; Anchor
        </p>
      </div>
    </footer>
  );
}