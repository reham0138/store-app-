import type { ReactNode } from "react";
import { X } from "lucide-react";
import { NavLink } from "react-router-dom";
import ThemeToggle from "../ThemeToggle";

export interface DashboardSidebarItem {
  label: string;
  path: string;
  icon: ReactNode;
  end?: boolean;
  badge?: number;
}

interface DashboardSidebarProps {
  items: DashboardSidebarItem[];
  title?: string;
  subtitle?: string;
  isOpen?: boolean;
  onClose?: () => void;
  footer?: ReactNode;
  navigationLabel?: string;
  side?: "left" | "right";
  desktopPersistent?: boolean;
}

export default function DashboardSidebar({
  items,
  title = "Dashboard",
  subtitle = "Management",
  isOpen = false,
  onClose,
  footer,
  navigationLabel = "Dashboard navigation",
  side = "left",
  desktopPersistent = true,
}: DashboardSidebarProps) {
  const sidePosition = side === "right"
    ? "end-0 border-s"
    : "start-0 border-e";
  const closedPosition = side === "right"
    ? "translate-x-full"
    : "-translate-x-full rtl:translate-x-full";
  const desktopPosition = desktopPersistent
    ? "lg:sticky lg:top-0 lg:h-screen lg:translate-x-0"
    : "";

  return (
    <aside
      id="store-sidebar"
      aria-label={navigationLabel}
      aria-hidden={!isOpen && !desktopPersistent}
      className={[
        "fixed inset-y-0 z-40 flex w-64 shrink-0 flex-col border-white/10 bg-brand-navy text-white transition-transform duration-200",
        sidePosition,
        desktopPosition,
        isOpen ? "translate-x-0" : closedPosition,
      ].join(" ")}
    >
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <NavLink to="/" onClick={onClose} aria-label="The Crown & Anchor home" className="flex min-w-0 items-center gap-3">
            <img src="/brand/logo/the-crown-anchor-logo-black.png" alt="" className="size-11 shrink-0 rounded bg-white p-1 object-contain dark:hidden" />
            <img src="/brand/logo/the-crown-anchor-logo-white.png" alt="" className="hidden size-11 shrink-0 object-contain dark:block" />
            <span className="min-w-0">
              <span className="block font-semibold text-white">The Crown &amp; Anchor</span>
              <span className="mt-1 block text-[10px] tracking-[0.13em] text-white/65">MORE THAN JUST A STORE</span>
            </span>
          </NavLink>
          <button type="button" onClick={onClose} aria-label="Close navigation" className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-white/70 hover:bg-white/10 hover:text-white lg:hidden">
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        <p className="mt-4 text-xs font-semibold text-brand-gold">{title}</p>
        <p className="mt-1 text-xs text-white/65">{subtitle}</p>
      </div>

      <nav aria-label={navigationLabel} className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="grid gap-1">
          {items.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) => [
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive ? "bg-brand-gold text-brand-navy" : "text-white/85 hover:bg-white/10 hover:text-white",
                ].join(" ")}
              >
                <span aria-hidden="true" className="shrink-0">{item.icon}</span>
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="flex min-w-5 items-center justify-center rounded-full bg-brand-gold px-1.5 py-0.5 text-xs font-bold text-brand-navy">{item.badge}</span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-3">
        <ThemeToggle />
        {footer}
      </div>
    </aside>
  );
}
