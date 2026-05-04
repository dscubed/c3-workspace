"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export interface InstagramPost {
  id: string;
  posted_by: string;
  caption: string;
  timestamp: number | null;
  location: string | null;
  images: string[];
  collaborators: string[] | null;
  fetched_at: string;
}

export interface SlugProfile {
  id: string;
  first_name: string;
  avatar_url: string | null;
  slug: string;
}

interface InstagramPostsResponse {
  data: InstagramPost[];
  slugToProfile: Record<string, SlugProfile>;
}

export function useInstagramPosts(clubId: string | null) {
  const { data, isLoading } = useSWR<InstagramPostsResponse>(
    clubId ? `/api/media/instagram/posts?club_id=${clubId}` : null,
    fetcher,
  );

  return {
    posts: data?.data ?? [],
    slugToProfile: data?.slugToProfile ?? {},
    isLoading,
  };
}
