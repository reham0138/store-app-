import { createContext } from "react";
import type { Branch } from "../types/type";

export type BranchContextValue = {
  branches: Branch[];
  selectedBranch: Branch | null;
  selectedByLocation: boolean;
  setSelectedBranch: (
    branch: Branch | null,
    selectedByLocation?: boolean,
  ) => void;
  setBranches: (branches: Branch[]) => void;
};

export const BranchContext = createContext<BranchContextValue | null>(null);
