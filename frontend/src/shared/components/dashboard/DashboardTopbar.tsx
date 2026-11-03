import type { ReactNode } from "react";
import { useAuth } from "../../hooks/useAuth";

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
  const { user } = useAuth();
  const displayName = userName ?? user?.name ?? "Store dashboard";

  return (
    <div className="flex min-h-16 flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-brand-navy">
          {displayName}
        </p>
        {branchName && (
          <p className="truncate text-xs text-text-slate">{branchName}</p>
        )}
      </div>

      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
