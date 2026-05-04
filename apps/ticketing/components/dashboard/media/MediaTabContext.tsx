"use client";

import { createContext, useContext } from "react";
import { MediaTab } from "./types";

interface MediaTabContextValue {
  active: MediaTab;
  changeTab: (tab: MediaTab) => void;
}

export const MediaTabContext = createContext<MediaTabContextValue | null>(null);

export function useMediaTab() {
  const ctx = useContext(MediaTabContext);
  if (!ctx)
    throw new Error("useMediaTab must be used within MediaTabContext.Provider");
  return ctx;
}
