import { BranchBadge } from "../shared/components/branch/BranchBadge";
import { BranchSelector } from "../shared/components/branch/BranchSelector";
import { BranchProvider } from "../shared/contexts/BranchProvider";
import { useBranch } from "../shared/contexts/useBranch";
import type { Branch } from "../shared/types/type";

const testBranches: Branch[] = [
  {
    id: "damascus",
    name: "Damascus",
    code: "DAM",
    address: "Damascus, Syria",
    latitude: 33.5138,
    longitude: 36.2765,
    isDefault: true,
  },
  {
    id: "homs",
    name: "Homs",
    code: "HOM",
    address: "Homs, Syria",
    latitude: 34.7324,
    longitude: 36.7137,
  },
  {
    id: "latakia",
    name: "Latakia",
    code: "LAT",
    address: "Latakia, Syria",
    latitude: 35.5317,
    longitude: 35.7901,
  },
];

function BranchSelectorTestContent() {
  const { selectedBranch, selectedByLocation } = useBranch();

  return (
    <section className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-10 sm:px-6">
      <header className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-gold">
          Component playground
        </p>
        <h1 className="text-2xl font-semibold text-brand-navy">
          Branch selector
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-text-slate">
          Switch between store branches in Damascus, Homs, and Latakia.
        </p>
      </header>

      <div className="grid gap-6 rounded-2xl border border-border-subtle bg-surface-white p-5 shadow-sm sm:p-8">
        <BranchSelector />
        <div className="grid gap-2">
          <h2 className="text-sm font-semibold text-brand-navy">
            Current branch
          </h2>
          <BranchBadge
            branch={selectedBranch}
            selectedByLocation={selectedByLocation}
          />
        </div>
        {selectedBranch && (
          <dl className="grid gap-3 border-t border-border-subtle pt-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium text-text-slate">Branch ID</dt>
              <dd className="mt-1 text-text-main">{selectedBranch.id}</dd>
            </div>
            <div>
              <dt className="font-medium text-text-slate">Address</dt>
              <dd className="mt-1 text-text-main">
                {selectedBranch.address ?? "Not provided"}
              </dd>
            </div>
          </dl>
        )}
      </div>
    </section>
  );
}

export default function BranchSelectorTestPage() {
  return (
    <BranchProvider
      initialBranches={testBranches}
      storageKey="branch-test-selectedBranchId"
    >
      <BranchSelectorTestContent />
    </BranchProvider>
  );
}
