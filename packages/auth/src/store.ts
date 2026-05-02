import { create } from "zustand";
import type { User } from "@supabase/supabase-js";

export interface Profile {
  id: string;
  account_type: "student" | "organisation" | string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  username: string | null;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  isOrganisation: () => boolean;
  isAuthenticated: () => boolean;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  isOrganisation: () => get().profile?.account_type === "organisation",
  isAuthenticated: () => get().user !== null,
  reset: () => set({ user: null, profile: null, loading: false }),
}));
