import { BranchBadge } from "../shared/components/branch/BranchBadge";
import { BranchSelector } from "../shared/components/branch/BranchSelector";
import { useBranch } from "../shared/contexts/useBranch";

function BranchesPageContent() {
  const { selectedBranch, selectedByLocation } = useBranch();

  return (
    <section className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-10 sm:px-6">
      <header className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-gold">
          Store locations
        </p>
        <h1 className="text-2xl font-semibold text-brand-navy">
          Choose your branch
        </h1>
        <p className="max-w-2xl text-sm leading-6 text-text-slate">
          Select a branch to see local product prices and availability.
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

export default function BranchesPage() {
  return <BranchesPageContent />;
}
