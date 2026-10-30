import { useContext } from "react";
import { BranchContext } from "./BranchContext";

export function useBranch() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error("useBranch must be used inside BranchProvider");
  }
  return context;
}
