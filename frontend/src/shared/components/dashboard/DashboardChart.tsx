import { useId, useState } from "react";

import { Select } from "../Select";

export interface DashboardChartDatum {
  key?: string;
  label: string;
  value: number;
  displayValue?: string;
}

export type DashboardChartView = "bar" | "line" | "donut";

interface DashboardChartProps {
  data: DashboardChartDatum[];
  emptyMessage?: string;
  availableViews?: DashboardChartView[];
  initialView?: DashboardChartView;
}

const chartColors = [
  "#D4AF37",
  "#0B2D4A",
  "#15803D",
  "#1D4ED8",
  "#A16207",
  "#64748B",
  "#B91C1C",
];

const viewLabels: Record<DashboardChartView, string> = {
  bar: "Bars",
  line: "Line",
  donut: "Donut",
};

function BarChart({ data }: { data: DashboardChartDatum[] }) {
  const maximum = Math.max(...data.map(({ value }) => Math.max(0, value)), 0);

  return (
    <div className="grid gap-4">
      {data.map(({ key, label, value, displayValue }) => (
        <div
          key={key ?? label}
          className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-3"
        >
          <span className="truncate text-sm text-text-slate">{label}</span>
          <div className="h-3 overflow-hidden rounded-full bg-surface-cream">
            <div
              className="h-full rounded-full bg-brand-gold transition-[width]"
              style={{
                width: `${maximum > 0 ? (Math.max(0, value) / maximum) * 100 : 0}%`,
              }}
            />
          </div>
          <span className="min-w-16 text-end text-sm font-medium text-brand-navy">
            {displayValue ?? value}
          </span>
        </div>
      ))}
    </div>
  );
}

function LineChart({ data }: { data: DashboardChartDatum[] }) {
  const maximum = Math.max(...data.map(({ value }) => Math.max(0, value)), 0);
  const points = data.map((item, index) => {
    const x = data.length === 1 ? 300 : 40 + (index / (data.length - 1)) * 520;
    const y = 190 - (maximum > 0 ? (Math.max(0, item.value) / maximum) * 150 : 0);
    return { ...item, x, y };
  });
  const path = points.map(({ x, y }, index) =>
    `${index === 0 ? "M" : "L"} ${x} ${y}`,
  ).join(" ");

  return (
    <div className="min-w-0">
      <svg
        aria-hidden="true"
        className="h-52 w-full overflow-visible"
        viewBox="0 0 600 220"
        preserveAspectRatio="none"
      >
        {[40, 90, 140, 190].map((y) => (
          <line
            key={y}
            x1="30"
            x2="580"
            y1={y}
            y2={y}
            stroke="#E5E7EB"
            strokeDasharray="4 5"
          />
        ))}
        <path
          d={path}
          fill="none"
          stroke="#D4AF37"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
        />
        {points.map(({ key, label, value, x, y }) => (
          <circle
            key={key ?? label}
            cx={x}
            cy={y}
            r="5"
            fill="#0B2D4A"
            stroke="white"
            strokeWidth="2"
          >
            <title>{`${label}: ${value}`}</title>
          </circle>
        ))}
      </svg>
      <div
        className="grid gap-1 text-center text-xs text-text-slate"
        style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}
      >
        {data.map(({ key, label, displayValue, value }) => (
          <div key={key ?? label} className="min-w-0">
            <p className="truncate">{label}</p>
            <p className="truncate font-medium text-brand-navy">
              {displayValue ?? value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ data }: { data: DashboardChartDatum[] }) {
  const positiveData = data
    .map((item, dataIndex) => ({ item, dataIndex }))
    .filter(({ item }) => item.value > 0);
  const total = positiveData.reduce((sum, { item }) => sum + item.value, 0);
  if (total <= 0) {
    return (
      <p className="py-8 text-center text-sm text-text-slate">
        Donut view requires values greater than zero.
      </p>
    );
  }

  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const offsets = positiveData.map((_, index) =>
    positiveData
      .slice(0, index)
      .reduce(
        (sum, { item }) => sum + (item.value / total) * circumference,
        0,
      ),
  );

  return (
    <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
      <svg
        aria-hidden="true"
        className="mx-auto size-48 max-w-full -rotate-90"
        viewBox="0 0 180 180"
      >
        {positiveData.map(({ item, dataIndex }, index) => {
          const { key, label, value } = item;
          const length = (value / total) * circumference;
          return (
            <circle
              key={key ?? label}
              cx="90"
              cy="90"
              r={radius}
              fill="none"
              stroke={chartColors[dataIndex % chartColors.length]}
              strokeDasharray={`${length} ${circumference - length}`}
              strokeDashoffset={-offsets[index]}
              strokeWidth="24"
            />
          );
        })}
      </svg>
      <ul className="grid gap-3">
        {data.map(({ key, label, value, displayValue }, index) => (
          <li key={key ?? label} className="flex min-w-0 items-center gap-2 text-sm">
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: chartColors[index % chartColors.length] }}
            />
            <span className="min-w-0 flex-1 truncate text-text-slate">{label}</span>
            <span className="shrink-0 font-medium text-brand-navy">
              {displayValue ?? value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function DashboardChart({
  data,
  emptyMessage = "No data available yet.",
  availableViews = ["bar", "line", "donut"],
  initialView = "bar",
}: DashboardChartProps) {
  const viewId = useId();
  const safeInitialView = availableViews.includes(initialView)
    ? initialView
    : availableViews[0] ?? "bar";
  const [view, setView] = useState<DashboardChartView>(safeInitialView);

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-text-slate">{emptyMessage}</p>
    );
  }

  return (
    <div className="grid gap-5">
      {availableViews.length > 1 && (
        <div className="flex items-center justify-end gap-2">
          <label
            htmlFor={viewId}
            className="text-xs font-medium text-text-slate"
          >
            Chart view
          </label>
          <Select
            id={viewId}
            aria-label="Chart view"
            value={view}
            options={availableViews.map((option) => ({
              value: option,
              label: viewLabels[option],
            }))}
            className="w-auto min-w-28"
            onChange={(event) => {
              const nextView = availableViews.find(
                (option) => option === event.currentTarget.value,
              );
              if (nextView) setView(nextView);
            }}
          />
        </div>
      )}
      <div
        role="img"
        aria-label={data
          .map(({ label, value, displayValue }) =>
            `${label}: ${displayValue ?? value}`,
          )
          .join(". ")}
      >
        {view === "bar" && <BarChart data={data} />}
        {view === "line" && <LineChart data={data} />}
        {view === "donut" && <DonutChart data={data} />}
      </div>
    </div>
  );
}
