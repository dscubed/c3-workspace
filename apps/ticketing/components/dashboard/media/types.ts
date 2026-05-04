import { StorageCategory } from "@/lib/hooks/useMediaStorage";

export type MediaTab = StorageCategory | "instagram";
export const VALID_TABS: MediaTab[] = [
  "images",
  "companies",
  "panelists",
  "instagram",
];
