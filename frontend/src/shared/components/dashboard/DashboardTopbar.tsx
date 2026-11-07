import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import ThemeToggle from "../ThemeToggle";

interface DashboardTopbarProps {
  userName?: string;
  branchName?: string;
  actions?: ReactNode;
}

export default function DashboardTopbar({
  userName,
  branchName,
  actions,
}: DashboardTopbarProps) {
  const { user, logout } = useAuth();
  const displayName = userName ?? user?.name ?? "Store dashboard";

  return (
    <div className="flex min-h-16 flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-brand-navy">{displayName}</p>
        {branchName && <p className="truncate text-xs text-text-slate">{branchName}</p>}
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle variant="surface" />
        {actions && <div className="flex items-center gap-2">{actions}</div>}
        <button
          type="button"
          onClick={logout}
          aria-label="Sign out"
          className="inline-flex items-center gap-2 rounded-lg border border-border-subtle px-3 py-2 text-sm font-medium text-brand-navy transition hover:bg-surface-cream"
        >
          <LogOut aria-hidden="true" size={16} />
          <span className="sr-only sm:not-sr-only">Sign out</span>
        </button>
      </div>
    </div>
  );
}
