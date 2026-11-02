import type { ReactNode } from "react";

interface DashboardPageHeaderProps {
  subTitle?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function DashboardPageHeader({
  subTitle,
  title,
  description,
  actions,
}: DashboardPageHeaderProps) {
  return (
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="min-w-0">
        {subTitle && (
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-gold">
            {subTitle}
          </p>
        )}
        <h1 className="mt-1 text-2xl font-semibold text-brand-navy sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-slate">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}
