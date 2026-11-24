import { useEffect, useState } from "react";
import {
  ClipboardList,
  LayoutDashboard,
  House,
  LogIn,
  LogOut,
  MapPin,
  Menu,
  ShoppingCart,
  ShoppingBag,
  UserRound,
  X,
} from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

import DashboardSidebar from "./dashboard/DashboardSidebar";
import type { DashboardSidebarItem } from "./dashboard/DashboardSidebar";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import { getDashboardPath } from "../utils/dashboardRoute";

export default function NavBar() {
  const { totalItems } = useCart();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [prevPathname, setPrevPathname] = useState(location.pathname);
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname);
    setIsOpen(false);
  }

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  const items: DashboardSidebarItem[] = [
    { label: "Home", path: "/", icon: <House size={18} />, end: true },
    { label: "Products", path: "/products", icon: <ShoppingBag size={18} /> },
    { label: "Branches", path: "/branches", icon: <MapPin size={18} /> },
    { label: "Cart", path: "/cart", icon: <ShoppingCart size={18} />, badge: totalItems },
  ];
  if (user) {
    items.push({ label: "Orders", path: "/orders", icon: <ClipboardList size={18} /> });
  }
  const dashboardPath = user ? getDashboardPath(user.role) : null;
  if (dashboardPath) {
    items.push({
      label: user?.role === "admin" ? "Admin dashboard" : "Branch dashboard",
      path: dashboardPath,
      icon: <LayoutDashboard size={18} />,
    });
  }

  const footer = user ? (
    <div className="mt-2 border-t border-white/10 pt-3">
      <p className="px-3 py-2 text-xs text-white/70">Signed in as</p>
      <p className="truncate px-3 text-sm font-semibold text-white">{user.name}</p>
      <button
        type="button"
        onClick={signOut}
        className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/85 hover:bg-white/10 hover:text-white"
      >
        <LogOut size={18} aria-hidden="true" /> Sign out
      </button>
    </div>
  ) : (
    <div className="mt-2 grid gap-1 border-t border-white/10 pt-3">
      <Link to="/login" onClick={() => setIsOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/85 hover:bg-white/10">
        <LogIn size={18} aria-hidden="true" /> Sign in
      </Link>
      <Link to="/register" onClick={() => setIsOpen(false)} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/85 hover:bg-white/10">
        <UserRound size={18} aria-hidden="true" /> Register
      </Link>
    </div>
  );

  function signOut() {
    try {
      logout();
    } finally {
      setIsOpen(false);
      navigate("/login", { replace: true });
    }
  }

  return (
    <>
      <DashboardSidebar
        items={items}
        title="Store navigation"
        subtitle="Browse The Crown & Anchor"
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        footer={footer}
        navigationLabel="Store navigation"
        side="right"
        desktopPersistent={false}
      />

      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border-subtle bg-surface-white px-4 xl:h-16 xl:px-8">
        <Link to="/" aria-label="The Crown & Anchor home" className="flex shrink-0 items-center gap-2 font-semibold text-brand-navy">
          <img
            src="/brand/logo/the-crown-anchor-logo-black.png"
            alt=""
            className="size-10 rounded bg-white p-0.5 object-contain dark:hidden"
          />
          <img
            src="/brand/logo/the-crown-anchor-logo-white.png"
            alt=""
            className="hidden size-10 object-contain dark:block"
          />
          <span className="hidden sm:inline">The Crown &amp; Anchor</span>
        </Link>

        <nav aria-label="Main navigation" className="mx-8 hidden min-w-0 flex-1 items-center justify-center gap-1 xl:flex">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                [
                  "inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition",
                  isActive
                    ? "bg-surface-cream text-brand-navy"
                    : "text-text-slate hover:bg-surface-cream hover:text-brand-navy",
                ].join(" ")
              }
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="flex min-w-5 items-center justify-center rounded-full bg-brand-gold px-1.5 py-0.5 text-xs font-bold text-brand-navy">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-3 xl:flex">
          {user ? (
            <>
              <span className="max-w-40 truncate text-sm text-text-slate">{user.name}</span>
              <button
                type="button"
                onClick={signOut}
                className="inline-flex items-center gap-2 rounded-lg border border-border-subtle px-3 py-2 text-sm font-medium text-brand-navy transition hover:bg-surface-cream"
              >
                <LogOut size={16} aria-hidden="true" />
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="rounded-lg px-3 py-2 text-sm font-medium text-brand-navy hover:bg-surface-cream">
                Sign in
              </Link>
              <Link to="/register" className="rounded-lg bg-brand-navy px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-navy/90">
                Register
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-label={isOpen ? "Close store navigation" : "Open store navigation"}
          aria-controls="store-sidebar"
          aria-expanded={isOpen}
          className="inline-flex size-10 items-center justify-center rounded-lg text-brand-navy hover:bg-surface-cream xl:hidden"
        >
          {isOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
        </button>
      </header>

      {isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Close store navigation"
          className="fixed inset-0 z-30 cursor-default bg-brand-navy/50"
        />
      )}
    </>
  );
}
