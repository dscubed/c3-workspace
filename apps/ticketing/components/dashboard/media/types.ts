import { StorageCategory } from "@/lib/hooks/dashboard/media/useMediaStorage";

export type MediaTab = StorageCategory | "instagram";
export const VALID_TABS: MediaTab[] = [
  "images",
  "companies",
  "panelists",
  "instagram",
];
