"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

export type StorageCategory = "images" | "companies" | "panelists";

export interface StorageItem {
  name: string;
  url: string;
  created_at: string;
}

interface StorageResponse {
  data: StorageItem[];
}

export function useMediaStorage(category: StorageCategory) {
  const { data, isLoading, mutate } = useSWR<StorageResponse>(
    `/api/media?category=${category}`,
    fetcher,
  );

  return {
    items: data?.data ?? [],
    isLoading,
    mutate,
  };
}
