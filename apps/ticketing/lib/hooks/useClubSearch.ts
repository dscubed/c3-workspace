import { useState, useEffect, useCallback } from "react";
import useSWRInfinite from "swr/infinite";
import { fetcher } from "@/lib/fetcher";
import type { ClubProfile } from "@/components/events/shared/types";

const PAGE_SIZE = 20;

export function useClubSearch(open: boolean) {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const getKey = (
    pageIndex: number,
    previousData: { data: ClubProfile[] } | null,
  ) => {
    if (!open) return null;
    if (previousData && (previousData.data ?? []).length < PAGE_SIZE)
      return null;
    const params = new URLSearchParams({
      table: "profiles",
      select: "id,first_name,avatar_url",
      filter: JSON.stringify({ account_type: "organisation" }),
      limit: String(PAGE_SIZE),
      offset: String(pageIndex * PAGE_SIZE),
    });
    if (debouncedSearch) params.set("search", debouncedSearch);
    return `/api/profiles/fetch?${params}`;
  };

  const { data: pages, size, setSize, isLoading } = useSWRInfinite(
    getKey,
    fetcher<{ data: ClubProfile[] }>,
    { revalidateFirstPage: false },
  );

  const clubs = (pages ?? []).flatMap((p) => p.data ?? []);
  const hasMore = pages
    ? (pages[pages.length - 1]?.data ?? []).length === PAGE_SIZE
    : false;

  const onScrollEnd = useCallback(() => {
    if (hasMore && !isLoading) setSize((s) => s + 1);
  }, [hasMore, isLoading, setSize]);

  const reset = useCallback(() => {
    setSearch("");
    setDebouncedSearch("");
  }, []);

  return {
    search,
    setSearch,
    clubs,
    loading: isLoading,
    hasMore,
    onScrollEnd,
    reset,
  };
}
