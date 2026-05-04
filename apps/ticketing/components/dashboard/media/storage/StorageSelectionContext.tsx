"use client";

import { createContext, useContext } from "react";
import type { useStorageSelection } from "@/lib/hooks/dashboard/media/useStorageSelection";

export type StorageSelectionValue = ReturnType<typeof useStorageSelection>;

export const StorageSelectionContext =
  createContext<StorageSelectionValue | null>(null);

export function useStorageSelectionContext() {
  const ctx = useContext(StorageSelectionContext);
  if (!ctx)
    throw new Error(
      "useStorageSelectionContext must be used within StorageSelectionContext.Provider",
    );
  return ctx;
}
