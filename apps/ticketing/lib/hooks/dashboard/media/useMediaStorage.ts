"use client";

import { RefObject } from "react";
import { useInfiniteScroll } from "@c3/hooks";

export type StorageCategory = "images" | "companies" | "panelists";

export interface StorageItem {
  name: string;
  url: string;
  created_at: string;
}

export function useMediaStorage(
  category: StorageCategory,
  scrollRef: RefObject<HTMLDivElement | null>,
) {
  const { items, isLoading, mutate } = useInfiniteScroll<StorageItem>(
    scrollRef,
    `/api/media?category=${category}`,
    { limit: 40 },
  );

  return {
    items,
    isLoading,
    mutate,
  };
}
