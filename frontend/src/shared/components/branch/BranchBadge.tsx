import { MapPin } from "lucide-react";
import type { Branch } from "../../types/type";

type BranchBadgeProps = {
  branch: Branch | null;
  selectedByLocation?: boolean;
};

export function BranchBadge({
  branch,
  selectedByLocation = false,
}: BranchBadgeProps) {
  return (
    <span
      className="inline-flex min-h-8 items-center gap-2 rounded-full border border-brand-gold/40 bg-brand-gold/10 px-3 py-1 text-sm font-medium text-brand-navy"
      role="status"
      aria-live="polite"
    >
      <span className="text-xs font-semibold uppercase tracking-wide text-text-slate">
        Branch
      </span>
      <span>{branch?.name ?? "None selected"}</span>
      {branch?.code && (
        <span className="rounded-full bg-surface-white px-2 py-0.5 text-xs text-text-slate">
          {branch.code}
        </span>
      )}
      {selectedByLocation && (
        <span className="inline-flex items-center gap-1 rounded-full bg-surface-white px-2 py-0.5 text-xs text-text-slate">
          <MapPin aria-hidden="true" size={12} />
          Nearby
        </span>
      )}
    </span>
  );
}
