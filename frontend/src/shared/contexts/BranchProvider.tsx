import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BranchContext } from "./BranchContext";
import type { Branch } from "../types/type";
import { getBranches } from "../services/branches.service";
import { queryKeys } from "../api/queryKeys";
import { USE_MOCK } from "../api/mock";
import { normalizeError } from "../api/errors";

type BranchProviderProps = {
  children: ReactNode;
  initialBranches?: Branch[];
  storageKey?: string;
};

const EMPTY_BRANCHES: Branch[] = [];
const MONGO_OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;

function readSelectedBranchId(storageKey: string): string | null {
  try {
    return localStorage.getItem(storageKey);
  } catch {
    return null;
  }
}

export function BranchProvider({
  children,
  initialBranches = EMPTY_BRANCHES,
  storageKey = "selectedBranchId",
}: BranchProviderProps) {
  const queryClient = useQueryClient();
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(() =>
    readSelectedBranchId(storageKey),
  );
  const [selectedByLocation, setSelectedByLocation] = useState(false);

  const branchesQuery = useQuery({
    queryKey: queryKeys.branches.all,
    queryFn: getBranches,
    enabled: initialBranches.length === 0,
  });

  const defaultBranchId = import.meta.env.VITE_DEFAULT_BRANCH_ID?.trim();
  const defaultBranchIdIsValid =
    typeof defaultBranchId === "string" &&
    MONGO_OBJECT_ID_PATTERN.test(defaultBranchId);
  const branches = useMemo(() => {
    if (initialBranches.length > 0) return initialBranches;
    if (branchesQuery.data) {
      return branchesQuery.data.map((branch) => ({
        ...branch,
        isDefault: branch.isDefault ?? branch.id === defaultBranchId,
      }));
    }
    if (!USE_MOCK && defaultBranchIdIsValid) {
      return [{
        id: defaultBranchId,
        name: import.meta.env.VITE_DEFAULT_BRANCH_NAME?.trim() || "Configured branch",
      }];
    }
    return EMPTY_BRANCHES;
  }, [initialBranches, branchesQuery.data, defaultBranchId, defaultBranchIdIsValid]);

  const selectedBranch =
    branches.find((branch) => branch.id === selectedBranchId) ??
    branches.find((branch) => branch.isDefault) ??
    branches.find((branch) => branch.name === "main") ??
    branches[0] ??
    null;
  const activeBranchId = selectedBranch?.id;

  const isLoading = initialBranches.length === 0 && branchesQuery.isLoading;
  const queryError = branchesQuery.error
    ? normalizeError(branchesQuery.error, "Unable to load branches.").message
    : null;
  const error =
    queryError ??
    (!isLoading && !selectedBranch && !USE_MOCK
      ? defaultBranchId && !defaultBranchIdIsValid
        ? "VITE_DEFAULT_BRANCH_ID must be the branch's 24-character MongoDB ObjectId, not its name or code."
        : "No branch is available. Configure VITE_DEFAULT_BRANCH_ID or sign in with a staff account."
      : null);

  useEffect(() => {
    if (!activeBranchId) return;
    try {
      localStorage.setItem(storageKey, activeBranchId);
    } catch {
      // Branch selection remains available for the current page if storage is disabled.
    }
  }, [activeBranchId, storageKey]);

  return (
    <BranchContext.Provider
      value={{
        branches,
        selectedBranch,
        selectedByLocation,
        isLoading,
        error,
        setSelectedBranch: (branch, byLocation = false) => {
          setSelectedBranchId(branch?.id ?? null);
          setSelectedByLocation(byLocation);
        },
        setBranches: (nextBranches) => {
          queryClient.setQueryData(queryKeys.branches.all, nextBranches);
        },
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}
