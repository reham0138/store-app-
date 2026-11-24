import type { Branch } from "../types/type";
import type { BranchOperationalStatus } from "../utils/branchStatusStorage";
import { apiClient, USE_MOCK, ApiError, normalizeError } from "../api/index.ts";
import {
  getBranchOperationalStatuses,
  saveBranchOperationalStatus,
} from "../utils/branchStatusStorage";
import { readId } from "../api/backendShapes";

interface BackendBranch {
  id?: string;
  _id?: string;
  name: string;
  code?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  isActive?: boolean;
}

function mapBranch(raw: BackendBranch): Branch {
  return {
    id: readId(raw),
    name: raw.name,
    code: raw.code,
    address: raw.address,
    latitude: raw.latitude,
    longitude: raw.longitude,
    operationalStatus: raw.isActive === false ? "closed" : "open",
  };
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
    !Array.isArray((data as { branches: Branch[] }).branches)
  ) {
    throw new Error("Branch data has an invalid format.");
  }
  const branches = (data as { branches: Branch[] }).branches;
  let statuses: Record<string, BranchOperationalStatus> = {};
  try {
    statuses = getBranchOperationalStatuses();
  } catch {
    statuses = {};
  }
  return branches.map((branch) => ({
    ...branch,
    operationalStatus: statuses[branch.id] ?? branch.operationalStatus ?? "open",
  }));
}

export async function getBranches(): Promise<Branch[]> {
  if (USE_MOCK) return fetchMockBranches();
  try {
    const { data } = await apiClient.get<BackendBranch | BackendBranch[]>("/branches");
    const branches = (Array.isArray(data) ? data : [data]).map(mapBranch);
    if (branches.length === 0) {
      throw new Error("The backend returned no branches.");
    }
    return branches;
  } catch (error) {
    const normalized = normalizeError(error, "Failed to load branches.");
    throw new ApiError(normalized.message, normalized.code, normalized.status);
  }
}

export async function updateBranchStatus(
  branchId: string,
  status: BranchOperationalStatus,
): Promise<Branch> {
  if (USE_MOCK) {
    saveBranchOperationalStatus(branchId, status);
    const branches = await fetchMockBranches();
    const updated = branches.find((branch) => branch.id === branchId);
    if (!updated) throw new ApiError("Branch not found.", "NOT_FOUND", 404);
    return updated;
  }
  try {
    const { data } = await apiClient.patch<BackendBranch>(
      `/branches/${branchId}`,
      { isActive: status === "open" },
    );
    return mapBranch(data);
  } catch (error) {
    const normalized = normalizeError(error, "Failed to update branch status.");
    throw new ApiError(normalized.message, normalized.code, normalized.status);
  }
}
