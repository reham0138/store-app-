import type { Branch } from "../types/type";
import type { BranchOperationalStatus } from "../utils/branchStatusStorage";
import { apiClient, USE_MOCK, ApiError, normalizeError } from "../api/index.ts";
import {
  getBranchOperationalStatuses,
  saveBranchOperationalStatus,
} from "../utils/branchStatusStorage";

interface BranchesResponse {
  branches: Branch[];
}

async function fetchMockBranches(): Promise<Branch[]> {
  const response = await fetch("/mock/branches.json");
  if (!response.ok) {
    throw new Error(`Failed to load branches (${response.status}).`);
  }
  const data: unknown = await response.json();
  if (
    typeof data !== "object" ||
    data === null ||
    !("branches" in data) ||
    !Array.isArray((data as BranchesResponse).branches)
  ) {
    throw new Error("Branch data has an invalid format.");
  }
  const branches = (data as BranchesResponse).branches;
  let statuses: Record<string, BranchOperationalStatus> = {};
  try {
    statuses = getBranchOperationalStatuses();
  } catch {
    statuses = {};
  }
  return branches.map((branch) => ({
    ...branch,
    operationalStatus: statuses[branch.id],
  }));
}

export async function getBranches(): Promise<Branch[]> {
  if (USE_MOCK) return fetchMockBranches();
  try {
    const { data } = await apiClient.get<Branch[] | { items: Branch[] }>("/branches");
    return Array.isArray(data) ? data : data.items;
  } catch (error) {
    throw new ApiError(normalizeError(error, "Failed to load branches.").message);
  }
}

export async function updateBranchStatus(
  branchId: string,
  status: BranchOperationalStatus,
): Promise<void> {
  if (USE_MOCK) {
    saveBranchOperationalStatus(branchId, status);
    return;
  }
  try {
    await apiClient.patch(`/branches/${branchId}/status`, {
      operationalStatus: status,
    });
  } catch (error) {
    throw new ApiError(normalizeError(error, "Failed to update branch status.").message);
  }
}
