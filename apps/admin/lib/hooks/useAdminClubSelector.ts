"use client";

import { useAuthStore, useClubStore } from "@c3/auth";
import type { ClubAdminRow } from "@c3/auth";

export interface UseClubSelectorReturn {
  clubs: ClubAdminRow[];
  loading: boolean;
  selectedClubId: string | null;
  setSelectedClubId: (id: string) => void;
  refetchClubs: () => void;
}

/** Thin compatibility shim — state now lives in @c3/auth's useClubStore. */
export function useAdminClubSelector(): UseClubSelectorReturn {
  const { user } = useAuthStore();
  const { clubs, activeClubId, clubsLoading, setActiveClubId } = useClubStore();

  void user; // auth gate handled by AuthProvider

  return {
    clubs,
    loading: clubsLoading,
    selectedClubId: activeClubId,
    setSelectedClubId: (id) => setActiveClubId(id),
    refetchClubs: () => {}, // revalidation driven by AuthProvider / focus handled there
  };
}

// Keep this so old imports of the hook still resolve without changes.
export { useClubStore } from "@c3/auth";
