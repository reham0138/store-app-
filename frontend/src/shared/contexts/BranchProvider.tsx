import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { BranchContext } from "./BranchContext";
import type { Branch } from "../types/type";

type BranchProviderProps = {
  children: ReactNode;
  initialBranches?: Branch[];
  storageKey?: string;
};

export function BranchProvider({
  children,
  initialBranches = [],
  storageKey = "selectedBranchId",
}: BranchProviderProps) {
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(() =>
    localStorage.getItem(storageKey),
  );
  const [selectedByLocation, setSelectedByLocation] = useState(false);
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
        setSelectedBranch: (branch, byLocation = false) => {
          setSelectedBranchId(branch?.id ?? null);
          setSelectedByLocation(byLocation);
        },
        setBranches,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}
