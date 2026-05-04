"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export interface InstagramImage {
  post_id: string;
  image_url: string;
  caption: string;
  posted_by: string;
}

interface InstagramMediaResponse {
  data: InstagramImage[];
}

export function useInstagramMedia(clubId: string | null) {
  const { data, isLoading } = useSWR<InstagramMediaResponse>(
    clubId ? `/api/media/instagram?club_id=${clubId}` : null,
    fetcher,
  );

  return {
    images: data?.data ?? [],
    isLoading,
  };
}
