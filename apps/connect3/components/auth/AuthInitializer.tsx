"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useClubStore } from "@/stores/clubStore";
import {
  useAuthStore as useSharedAuthStore,
  useClubStore as useSharedClubStore,
} from "@c3/auth";

async function fetchMyClubs() {
  try {
    const res = await fetch("/api/clubs/my-clubs");
    if (!res.ok) return [];
    const { data } = await res.json();
    return data ?? [];
  } catch {
    return [];
  }
}

export function AuthInitializer() {
  const initialize = useAuthStore((state) => state.initialize);
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const loading = useAuthStore((state) => state.loading);
  const setClubs = useClubStore((s) => s.setClubs);
  const setActiveClubId = useClubStore((s) => s.setActiveClubId);
  const setClubsLoading = useClubStore((s) => s.setClubsLoading);

  const setSharedUser = useSharedAuthStore((s) => s.setUser);
  const setSharedProfile = useSharedAuthStore((s) => s.setProfile);
  const setSharedLoading = useSharedAuthStore((s) => s.setLoading);
  const setSharedClubs = useSharedClubStore((s) => s.setClubs);
  const setSharedActiveClubId = useSharedClubStore((s) => s.setActiveClubId);
  const setSharedClubsLoading = useSharedClubStore((s) => s.setClubsLoading);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Sync local auth state into shared @c3/auth store (used by AppSidebar)
  useEffect(() => {
    setSharedLoading(loading);
    setSharedUser(user);
    setSharedProfile(
      profile
        ? {
            id: profile.id,
            account_type: profile.account_type ?? "student",
            first_name: profile.first_name ?? null,
            last_name: profile.last_name ?? null,
            avatar_url: profile.avatar_url ?? null,
            username: null,
          }
        : null,
    );
  }, [
    user,
    profile,
    loading,
    setSharedUser,
    setSharedProfile,
    setSharedLoading,
  ]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setClubs([]);
      setActiveClubId(null);
      setClubsLoading(false);
      setSharedClubs([]);
      setSharedActiveClubId(null);
      setSharedClubsLoading(false);
      return;
    }
    setClubsLoading(true);
    setSharedClubsLoading(true);
    fetchMyClubs().then((clubs) => {
      setClubs(clubs);
      setSharedClubs(clubs);
      if (clubs.length > 0) {
        setActiveClubId(clubs[0].club_id);
        setSharedActiveClubId(clubs[0].club_id);
      }
      setClubsLoading(false);
      setSharedClubsLoading(false);
    });
  }, [
    user,
    loading,
    setClubs,
    setActiveClubId,
    setClubsLoading,
    setSharedClubs,
    setSharedActiveClubId,
    setSharedClubsLoading,
  ]);

  return null;
}
