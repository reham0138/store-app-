import type { ReactNode } from "react";

type StatTrend = "positive" | "negative" | "neutral";

interface StatCardProps {
  label: string;
  value: string;
  description?: string;
  trend?: string;
  trendType?: StatTrend;
  icon?: ReactNode;
}

const trendStyles: Record<StatTrend, string> = {
  positive: "text-status-success",
  negative: "text-status-error",
  neutral: "text-text-slate",
};

export default function StatCard({
  label,
  value,
  description,
  trend,
  trendType = "neutral",
  icon,
}: StatCardProps) {
  return (
    <article className="rounded-2xl border border-border-subtle bg-surface-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-text-slate">{label}</p>
        {icon && (
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-navy"
          >
            {icon}
          </span>
        )}
      </div>

      <p className="mt-4 text-2xl font-semibold text-brand-navy">{value}</p>

      {(trend || description) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {trend && (
            <span className={`font-semibold ${trendStyles[trendType]}`}>
              {trend}
            </span>
          )}
          {description && <span className="text-text-slate">{description}</span>}
        </div>
      )}
    </article>
  );
}
