import { useState } from "react";
import {
  ClipboardList,
  House,
  LogIn,
  LogOut,
  Menu,
  MapPin,
  ShoppingCart,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { useCart } from "../contexts/CartContext";

const navigationLinkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "bg-surface-cream text-brand-navy"
      : "text-brand-navy hover:bg-surface-cream"
  }`;

export default function NavBar() {
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <header className="relative z-20 border-b border-border-subtle bg-surface-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          to="/"
          onClick={closeMenu}
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

        <div className="flex items-center">
          <nav
            id="primary-navigation"
            aria-label="Main navigation"
            className={`${isMenuOpen ? "flex" : "hidden"} absolute left-0 right-0 top-full flex-col gap-1 border-b border-border-subtle bg-surface-white p-3 shadow-lg md:static md:flex md:flex-row md:items-center md:gap-1 md:border-0 md:p-0 md:shadow-none`}
          >
            <NavLink to="/" end onClick={closeMenu} className={navigationLinkClass}>
              <House aria-hidden="true" size={18} />
              Home
            </NavLink>
            <NavLink to="/products" onClick={closeMenu} className={navigationLinkClass}>
              <ShoppingBag aria-hidden="true" size={18} />
              Products
            </NavLink>
            <NavLink to="/branches" onClick={closeMenu} className={navigationLinkClass}>
              <MapPin aria-hidden="true" size={18} />
              Branches
            </NavLink>
            <NavLink
              to="/cart"
              onClick={closeMenu}
              className={navigationLinkClass}
              aria-label={`Shopping cart, ${totalItems} items`}
            >
              <span className="relative">
                <ShoppingCart aria-hidden="true" size={20} />
                {totalItems > 0 && (
                  <span className="absolute -right-2 -top-2 flex size-5 items-center justify-center rounded-full bg-brand-gold text-xs font-bold text-brand-navy">
                    {totalItems}
                  </span>
                )}
              </span>
              Cart
            </NavLink>
            <NavLink to="/orders" onClick={closeMenu} className={navigationLinkClass}>
              <ClipboardList aria-hidden="true" size={18} />
              Orders
            </NavLink>

            {user ? (
              <div className="flex flex-col gap-1 border-t border-border-subtle pt-2 md:flex-row md:border-0 md:pt-0">
                <span className="px-3 py-2 text-sm text-text-slate md:hidden">
                  Signed in as {user.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    closeMenu();
                  }}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-brand-navy hover:bg-surface-cream"
                >
                  <LogOut aria-hidden="true" size={18} />
                  Sign out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1 border-t border-border-subtle pt-2 md:flex-row md:border-0 md:pt-0">
                <NavLink
                  to="/login"
                  onClick={closeMenu}
                  className={navigationLinkClass}
                >
                  <LogIn aria-hidden="true" size={18} />
                  Sign in
                </NavLink>
                <NavLink
                  to="/register"
                  onClick={closeMenu}
                  className={navigationLinkClass}
                >
                  <UserRound aria-hidden="true" size={18} />
                  Register
                </NavLink>
              </div>
            )}
          </nav>

          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-lg text-brand-navy hover:bg-surface-cream md:hidden"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-controls="primary-navigation"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((isOpen) => !isOpen)}
          >
            {isMenuOpen ? (
              <X aria-hidden="true" size={22} />
            ) : (
              <Menu aria-hidden="true" size={22} />
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
