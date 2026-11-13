import { createContext } from "react";
import type { Branch } from "../types/type";

export type BranchContextValue = {
  branches: Branch[];
  selectedBranch: Branch | null;
  selectedByLocation: boolean;
  isLoading: boolean;
  error: string | null;
  setSelectedBranch: (
    branch: Branch | null,
    selectedByLocation?: boolean,
  ) => void;
  setBranches: (branches: Branch[]) => void;
};

export const BranchContext = createContext<BranchContextValue | null>(null);
