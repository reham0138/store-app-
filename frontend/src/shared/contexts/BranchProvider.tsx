import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { BranchContext } from "./BranchContext";
import type { Branch } from "../types/type";

type BranchProviderProps = {
  children: ReactNode;
  initialBranches?: Branch[];
  storageKey?: string;
};

const EMPTY_BRANCHES: Branch[] = [];

export function BranchProvider({
  children,
  initialBranches = EMPTY_BRANCHES,
  storageKey = "selectedBranchId",
}: BranchProviderProps) {
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [isLoading, setIsLoading] = useState(initialBranches.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(() =>
    localStorage.getItem(storageKey),
  );
  const [selectedByLocation, setSelectedByLocation] = useState(false);

  useEffect(() => {
    if (initialBranches.length > 0) return;

    let isMounted = true;

    async function loadBranches() {
      try {
        const response = await fetch("/mock/branches.json");
        if (!response.ok) {
          throw new Error(`Failed to load branches (${response.status}).`);
        }

        const data: unknown = await response.json();
        if (!isBranchListResponse(data)) {
          throw new Error("Branch data has an invalid format.");
        }

        if (isMounted) setBranches(data.branches);
      } catch (loadError) {
        console.error("Unable to load branches.", loadError);
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load branches.",
          );
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadBranches();

    return () => {
      isMounted = false;
    };
  }, [initialBranches]);

  const selectedBranch =
    branches.find((branch) => branch.id === selectedBranchId) ??
    branches.find((branch) => branch.isDefault) ??
    branches.find((branch) => branch.name === "main") ??
    branches[0] ??
    null;
  const activeBranchId = selectedBranch?.id;

  useEffect(() => {
    if (activeBranchId) {
      localStorage.setItem(storageKey, activeBranchId);
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
          setBranches(nextBranches);
          setIsLoading(false);
          setError(null);
        },
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

function isBranchListResponse(
  value: unknown,
): value is { branches: Branch[] } {
  if (
    typeof value !== "object" ||
    value === null ||
    !("branches" in value) ||
    !Array.isArray(value.branches)
  ) {
    return false;
  }

  return value.branches.every(
    (branch) =>
      typeof branch === "object" &&
      branch !== null &&
      "id" in branch &&
      typeof branch.id === "string" &&
      "name" in branch &&
      typeof branch.name === "string",
  );
}
