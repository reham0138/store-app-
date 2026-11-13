export type BranchOperationalStatus = "open" | "closed";

const STORAGE_KEY = "crown-anchor-branch-operational-status";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getBranchOperationalStatuses(): Record<
  string,
  BranchOperationalStatus
> {
  const savedStatuses = localStorage.getItem(STORAGE_KEY);
  if (savedStatuses === null) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(savedStatuses);
  } catch {
    throw new Error("Saved branch status data is invalid.");
  }

  if (!isRecord(parsed)) {
    throw new Error("Saved branch status data has an invalid format.");
  }

  const statuses: Record<string, BranchOperationalStatus> = {};
  for (const [branchId, status] of Object.entries(parsed)) {
    if (status !== "open" && status !== "closed") {
      throw new Error("Saved branch status data has an invalid format.");
    }
    statuses[branchId] = status;
  }
  return statuses;
}

export function saveBranchOperationalStatus(
  branchId: string,
  status: BranchOperationalStatus | "",
): Record<string, BranchOperationalStatus> {
  if (!branchId.trim()) {
    throw new Error("A branch is required to update its status.");
  }

  const statuses = getBranchOperationalStatuses();
  if (status) {
    statuses[branchId] = status;
  } else {
    delete statuses[branchId];
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(statuses));
  window.dispatchEvent(new Event("branch-status-updated"));
  return statuses;
}
