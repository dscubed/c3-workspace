"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "@c3/auth";

export interface ClubProfile {
  id: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
}

export interface ClubAdminRow {
  id: string;
  club_id: string;
  role: string;
  status: string;
  created_at: string;
  club: ClubProfile | null;
}

export interface UseClubSelectorReturn {
  clubs: ClubAdminRow[];
  loading: boolean;
  selectedClubId: string | null;
  setSelectedClubId: (id: string) => void;
  refetchClubs: () => void;
}

export function useAdminClubSelector(
  initialClubId?: string | null,
): UseClubSelectorReturn {
  const { user } = useAuthStore();

  const [clubs, setClubs] = useState<ClubAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClubId, setSelectedClubId] = useState<string | null>(
    initialClubId ?? null,
  );
  const hasFetched = useRef(false);

  const fetchClubs = useCallback(async () => {
    if (!user) return;
    if (!hasFetched.current) setLoading(true);
    try {
      const res = await fetch("/api/clubs/my-clubs");
      if (res.ok) {
        const { data } = await res.json();
        const rows: ClubAdminRow[] = data ?? [];
        setClubs(rows);
        if (rows.length > 0 && !selectedClubId) {
          if (initialClubId && rows.some((r) => r.club_id === initialClubId)) {
            setSelectedClubId(initialClubId);
          } else {
            setSelectedClubId(rows[0].club_id);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch clubs:", err);
    } finally {
      hasFetched.current = true;
      setLoading(false);
    }
  }, [user, selectedClubId, initialClubId]);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  useEffect(() => {
    const onFocus = () => fetchClubs();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchClubs]);

  return { clubs, loading, selectedClubId, setSelectedClubId, refetchClubs: fetchClubs };
}
