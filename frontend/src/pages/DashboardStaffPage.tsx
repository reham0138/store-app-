import { useState } from "react";
import type { FormEvent } from "react";
import { UserRound } from "lucide-react";

import Button from "../shared/components/Button";
import { FormError } from "../shared/components/FormError";
import {
  DashboardCard,
  DashboardPageHeader,
  DashboardTable,
  StatCard,
} from "../shared/components/dashboard";
import type { DashboardTableColumn } from "../shared/components/dashboard";
import { Input } from "../shared/components/Input";
import { Label } from "../shared/components/Label";
import { Select } from "../shared/components/Select";
import { useBranch } from "../shared/contexts/useBranch";
import { normalizeError } from "../shared/api/errors";
import { USE_MOCK } from "../shared/api/mock";
import type { StaffMember } from "../shared/services/staff.service";
import {
  useAssignStaffBranchMutation,
  useCreateStaffMutation,
  useStaffQuery,
} from "../shared/hooks/useApiQueries";

const EMPTY_STAFF: StaffMember[] = [];

export default function DashboardStaffPage() {
  const { branches, isLoading: branchesLoading, error: branchesError } = useBranch();
  const staffQuery = useStaffQuery(!USE_MOCK);
  const createMutation = useCreateStaffMutation();
  const assignMutation = useAssignStaffBranchMutation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newBranchId, setNewBranchId] = useState("");
  const [updatingStaffId, setUpdatingStaffId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const staff = staffQuery.data ?? EMPTY_STAFF;

  async function handleCreateStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError("");
    setActionMessage("");
    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        email: email.trim(),
        password,
        branchId: newBranchId,
      });
      setName("");
      setEmail("");
      setPassword("");
      setNewBranchId("");
      setActionMessage("Staff account created and assigned to a branch.");
    } catch (error) {
      setActionError(normalizeError(error, "Unable to create staff account.").message);
    }
  }

  async function handleAssignBranch(staffId: string, branchId: string) {
    if (!branchId) return;
    setUpdatingStaffId(staffId);
    setActionError("");
    setActionMessage("");
    try {
      await assignMutation.mutateAsync({ staffId, branchId });
      setActionMessage(
        "Branch assignment updated. Ask this staff member to sign out and back in to refresh access.",
      );
    } catch (error) {
      setActionError(
        normalizeError(error, "Unable to assign the staff member to a branch.").message,
      );
    } finally {
      setUpdatingStaffId(null);
    }
  }

  const columns: DashboardTableColumn<StaffMember>[] = [
    {
      key: "staff",
      header: "Staff member",
      render: (member) => (
        <div>
          <p className="font-medium text-brand-navy">{member.name}</p>
          <p className="text-xs text-text-slate">{member.email}</p>
        </div>
      ),
    },
    {
      key: "branch",
      header: "Assigned branch",
      render: (member) => (
        <Select
          aria-label={`Branch for ${member.name}`}
          value={member.branchId ?? ""}
          disabled={branchesLoading || updatingStaffId === member.id}
          placeholder={member.branchId ? "Select branch" : "Unassigned — select a branch"}
          options={branches.map((branch) => ({
            value: branch.id,
            label: branch.name,
            disabled: branch.operationalStatus === "closed",
          }))}
          onChange={(event) => {
            void handleAssignBranch(member.id, event.currentTarget.value);
          }}
        />
      ),
    },
  ];

  return (
    <section className="mx-auto grid min-w-0 w-full max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <DashboardPageHeader
        subTitle="Admin dashboard"
        title="Staff"
        description="Create staff accounts and assign each staff member to an active branch."
      />

      {USE_MOCK ? (
        <DashboardCard title="Live backend required">
          <p className="text-sm text-text-slate">
            Staff management is available when the frontend is connected to the backend.
          </p>
        </DashboardCard>
      ) : (
        <>
          <StatCard
            label="Staff members"
            value={staffQuery.isLoading ? "—" : String(staff.length)}
            description="Branch-assigned accounts"
            icon={<UserRound size={20} />}
          />

          <DashboardCard
            title="Create staff account"
            description="New staff accounts must be assigned to an active branch."
          >
            <form onSubmit={(event) => void handleCreateStaff(event)} className="grid gap-4 md:grid-cols-2">
              <Label label="Full name">
                <Input
                  autoComplete="name"
                  minLength={2}
                  required
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </Label>
              <Label label="Email">
                <Input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </Label>
              <Label label="Temporary password">
                <Input
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </Label>
              <Label label="Branch">
                <Select
                  required
                  value={newBranchId}
                  disabled={branchesLoading}
                  placeholder="Select an active branch"
                  options={branches
                    .filter((branch) => branch.operationalStatus !== "closed")
                    .map((branch) => ({ value: branch.id, label: branch.name }))}
                  onChange={(event) => setNewBranchId(event.target.value)}
                />
              </Label>
              <div className="md:col-span-2">
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending ||
                    branchesLoading ||
                    branches.filter((branch) => branch.operationalStatus !== "closed").length === 0
                  }
                >
                  {createMutation.isPending ? "Creating..." : "Create staff account"}
                </Button>
              </div>
            </form>
          </DashboardCard>

          <DashboardCard
            title="Branch assignments"
            description="Choose a branch to assign or reassign a staff member."
          >
            {actionError && <FormError message={actionError} />}
            {actionMessage && (
              <p className="mb-4 text-sm text-status-success" role="status">
                {actionMessage}
              </p>
            )}
            {branchesError && <FormError message={branchesError} />}
            {staffQuery.error && (
              <FormError
                message={normalizeError(staffQuery.error, "Unable to load staff.").message}
              />
            )}
            {staffQuery.isLoading ? (
              <p className="py-8 text-center text-sm text-text-slate" role="status">
                Loading staff...
              </p>
            ) : (
              <DashboardTable
                columns={columns}
                rows={staff}
                getRowKey={(member) => member.id}
                emptyMessage="No staff accounts found."
              />
            )}
            {!branchesLoading && branches.length === 0 && !branchesError && (
              <p className="mt-4 text-sm text-status-error" role="alert">
                Create an active branch before assigning staff.
              </p>
            )}
          </DashboardCard>
        </>
      )}
    </section>
  );
}
