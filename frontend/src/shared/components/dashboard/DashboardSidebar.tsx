import type { ReactNode } from "react";
import { X } from "lucide-react";
import { NavLink } from "react-router-dom";

export interface DashboardSidebarItem {
  label: string;
  path: string;
  icon: ReactNode;
  end?: boolean;
}

interface DashboardSidebarProps {
  items: DashboardSidebarItem[];
  title?: string;
  subtitle?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function DashboardSidebar({
  items,
  title = "Dashboard",
  subtitle = "Management",
  isOpen = false,
  onClose,
}: DashboardSidebarProps) {
  return (
    <aside
      className={[
        "fixed inset-y-0 start-0 z-30 flex w-64 shrink-0 flex-col border-e border-border-subtle bg-brand-navy text-white transition-transform duration-200 lg:static lg:min-h-full lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full",
      ].join(" ")}
    >
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-brand-gold">{title}</p>
            <p className="mt-1 text-xs text-white/65">{subtitle}</p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dashboard navigation"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
            >
              <X aria-hidden="true" size={18} />
            </button>
          )}
        </div>
      </div>

      <nav aria-label="Dashboard navigation" className="flex-1 px-3 py-4">
        <ul className="grid gap-1">
          {items.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.end}
                onClick={onClose}
                className={({ isActive }) =>
                  [
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand-gold text-brand-navy"
                      : "text-white/80 hover:bg-white/10 hover:text-white",
                  ].join(" ")
                }
              >
                <span aria-hidden="true" className="shrink-0">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
