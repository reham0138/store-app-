import { apiClient, ApiError, normalizeError } from "../api";
import { readId } from "../api/backendShapes";

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  branchId?: string;
}

export interface CreateStaffInput {
  name: string;
  email: string;
  password: string;
  branchId: string;
}

interface BackendStaff {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  branchId?: string;
}

function mapStaff(raw: BackendStaff): StaffMember {
  return {
    id: readId(raw),
    name: raw.name,
    email: raw.email,
    branchId: raw.branchId,
  };
}

function throwStaffError(error: unknown, fallback: string): never {
  const normalized = normalizeError(error, fallback);
  throw new ApiError(
    normalized.message,
    normalized.code,
    normalized.status,
    normalized.details,
  );
}

export async function getStaff(): Promise<StaffMember[]> {
  try {
    const { data } = await apiClient.get<BackendStaff[]>("/users/staff");
    if (!Array.isArray(data)) {
      throw new Error("The backend returned an invalid staff list.");
    }
    return data.map(mapStaff);
  } catch (error) {
    throwStaffError(error, "Unable to load staff.");
  }
}

export async function createStaff(input: CreateStaffInput): Promise<StaffMember> {
  try {
    const { data } = await apiClient.post<BackendStaff>("/users/staff", input);
    return mapStaff(data);
  } catch (error) {
    throwStaffError(error, "Unable to create staff account.");
  }
}

export async function assignStaffBranch(
  staffId: string,
  branchId: string,
): Promise<StaffMember> {
  try {
    const { data } = await apiClient.patch<BackendStaff>(
      `/users/staff/${staffId}`,
      { branchId },
    );
    return mapStaff(data);
  } catch (error) {
    throwStaffError(error, "Unable to assign the staff member to a branch.");
  }
}
