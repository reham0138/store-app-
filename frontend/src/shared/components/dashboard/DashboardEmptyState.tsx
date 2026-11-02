import type { ReactNode } from "react";

interface DashboardEmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export default function DashboardEmptyState({
  title,
  description,
  icon,
  action,
}: DashboardEmptyStateProps) {
  return (
    <div className="grid justify-items-center gap-3 px-5 py-12 text-center">
      {icon && (
        <span
          aria-hidden="true"
          className="flex size-12 items-center justify-center rounded-full bg-brand-gold/15 text-brand-navy"
        >
          {icon}
        </span>
      )}
      <h2 className="text-lg font-semibold text-brand-navy">{title}</h2>
      {description && (
        <p className="max-w-md text-sm leading-6 text-text-slate">
          {description}
        </p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
