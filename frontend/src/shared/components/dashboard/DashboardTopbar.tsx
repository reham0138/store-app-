import type { ReactNode } from "react";

interface DashboardTopbarProps {
  userName?: string;
  branchName?: string;
  actions?: ReactNode;
}

export default function DashboardTopbar({
  userName = "Dashboard User",
  branchName,
  actions,
}: DashboardTopbarProps) {
  return (
    <div className="flex min-h-16 flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-brand-navy">
          {userName}
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
