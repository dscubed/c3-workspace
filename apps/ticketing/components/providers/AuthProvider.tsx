"use client";

import { useEffect } from "react";
import { createClient } from "@c3/supabase/client";
import { useAuthStore } from "@c3/auth";
import { useClubStore } from "@c3/auth";
import type { Profile } from "@c3/auth";
import type { ClubAdminRow } from "@c3/auth";
import { claimGuestRegistrations } from "@/app/actions/claimGuestRegistrations";

const supabase = createClient();

async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    const res = await fetch(
      `/api/profiles/fetch?id=${userId}&select=id,account_type,first_name,avatar_url`,
    );
    if (!res.ok) return null;
    const { data } = await res.json();
    return data as Profile;
  } catch {
    return null;
  }
}

async function fetchMyClubs(): Promise<ClubAdminRow[]> {
  try {
    const res = await fetch("/api/clubs/my-clubs");
    if (!res.ok) return [];
    const { data } = await res.json();
    return data ?? [];
  } catch {
    return [];
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((s) => s.setUser);
  const setProfile = useAuthStore((s) => s.setProfile);
  const setLoading = useAuthStore((s) => s.setLoading);
  const setClubs = useClubStore((s) => s.setClubs);
  const setActiveClubId = useClubStore((s) => s.setActiveClubId);
  const setClubsLoading = useClubStore((s) => s.setClubsLoading);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (data.user) {
        const [profile, clubs] = await Promise.all([
          fetchProfile(data.user.id),
          fetchMyClubs(),
        ]);
        setProfile(profile);
        setClubs(clubs);
        if (clubs.length > 0) setActiveClubId(clubs[0].club_id);
        // Claim any guest registrations purchased before login
        if (data.user.email) {
          claimGuestRegistrations(data.user.id, data.user.email).catch(() => {});
        }
      }
      setLoading(false);
      setClubsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user ?? null;
      setUser(user);
      if (user) {
        const [profile, clubs] = await Promise.all([
          fetchProfile(user.id),
          fetchMyClubs(),
        ]);
        setProfile(profile);
        setClubs(clubs);
        if (clubs.length > 0) setActiveClubId(clubs[0].club_id);
        // Claim any guest registrations purchased during this session
        if (user.email) {
          claimGuestRegistrations(user.id, user.email).catch(() => {});
        }
      } else {
        setProfile(null);
        setClubs([]);
        setActiveClubId(null);
      }
      setClubsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setUser, setProfile, setLoading, setClubs, setActiveClubId, setClubsLoading]);

  return <>{children}</>;
}
