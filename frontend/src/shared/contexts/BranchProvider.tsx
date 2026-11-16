import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { BranchContext } from "./BranchContext";
import type { Branch } from "../types/type";
import { getBranches } from "../services/branches.service";
import { normalizeError } from "../api/errors";

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

    getBranches()
      .then((data) => {
        if (isMounted) setBranches(data);
      })
      .catch((loadError) => {
        console.error("Unable to load branches.", loadError);
        if (isMounted) {
          setError(
            normalizeError(loadError, "Unable to load branches.").message,
          );
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

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
