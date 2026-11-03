import type { ReactNode } from "react";

interface DashboardCardProps {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function DashboardCard({
  title,
  description,
  actions,
  children,
  className = "",
}: DashboardCardProps) {
  return (
    <section
      className={`min-w-0 rounded-2xl border border-border-subtle bg-surface-white p-5 shadow-sm sm:p-6 ${className}`}
    >
      {(title || description || actions) && (
        <header className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div className="min-w-0">
            {title && (
              <h2 className="text-lg font-semibold text-brand-navy">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-sm leading-6 text-text-slate">
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
      )}

      {children}
    </section>
  );
}
