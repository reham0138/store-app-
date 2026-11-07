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
import { Link, useLocation } from "react-router-dom";

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

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

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
    { label: "Orders", path: "/orders", icon: <ClipboardList size={18} /> },
  ];
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
        onClick={() => { logout(); setIsOpen(false); }}
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

      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border-subtle bg-surface-white px-4">
        <Link to="/" className="font-semibold text-brand-navy">The Crown &amp; Anchor</Link>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-label={isOpen ? "Close store navigation" : "Open store navigation"}
          aria-controls="store-sidebar"
          aria-expanded={isOpen}
          className="inline-flex size-10 items-center justify-center rounded-lg text-brand-navy hover:bg-surface-cream"
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
