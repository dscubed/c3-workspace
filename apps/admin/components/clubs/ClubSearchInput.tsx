"use client";

import { useRef, useState, useCallback } from "react";
import { useInfiniteScroll } from "@c3/hooks";
import { Avatar, AvatarFallback, AvatarImage } from "@c3/ui";
import { Search, Loader2, X } from "lucide-react";

export interface ClubResult {
  id: string;
  first_name: string;
  avatar_url: string | null;
}

export interface ClubSearchInputProps {
  /** Called when the user selects a club from the dropdown */
  onSelect: (club: ClubResult) => void;
  placeholder?: string;
}

export function ClubSearchInput({
  onSelect,
  placeholder = "Search clubs…",
}: ClubSearchInputProps) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Only pass a truthy endpoint once the user has started typing.
  // Passing null pauses fetching (hook contract).
  const endpoint = "/api/clubs/search";

  const { items, isLoading, isValidating, sentinelRef } =
    useInfiniteScroll<ClubResult>(listRef, endpoint, 
      process.env.NEXT_PUBLIC_SITE_URL,
      {
      limit: 18,
      queryParams: query.trim() ? { q: query.trim() } : {},
    });

  const handleSelect = useCallback(
    (club: ClubResult) => {
      onSelect(club);
      setQuery("");
      setFocused(false);
    },
    [onSelect],
  );

  const showDropdown = focused;
  const loading = isLoading || isValidating;

  return (
    <div ref={containerRef} className="relative w-full">
      {/* ── Search input ── */}
      <div
        className="flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all duration-150"
        style={{
          borderColor: focused ? "#c4b5fd" : "#e5e7eb",
          boxShadow: focused ? "0 0 0 3px rgba(196,181,253,0.25)" : "none",
          background: "white",
        }}
      >
        <Search className="h-4 w-4 shrink-0" style={{ color: "#a78bfa" }} />
        <input
          id="club-search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            // Don't close if focus moved inside the container (list items)
            if (!containerRef.current?.contains(e.relatedTarget as Node)) {
              setTimeout(() => setFocused(false), 150);
            }
          }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-700"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setQuery("")}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* ── Floating results dropdown ── */}
      {showDropdown && (
        <div
          ref={listRef}
          className="absolute left-0 right-0 top-full z-50 max-h-30 overflow-y-auto rounded-xl border bg-white shadow-lg"
          style={{
            borderColor: "#ede9fe",
            boxShadow:
              "0 8px 24px rgba(109,40,217,0.08), 0 2px 8px rgba(0,0,0,0.06)",
          }}
        >
          {/* Results */}
          {items.map((club) => (
            <button
              key={club.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(club)}
              className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-violet-50"
            >
              <Avatar className="h-7 w-7 shrink-0">
                {club.avatar_url && (
                  <AvatarImage src={club.avatar_url} alt={club.first_name} />
                )}
                <AvatarFallback
                  className="text-[10px] font-semibold"
                  style={{ background: "#ede9fe", color: "#7c3aed" }}
                >
                  {club.first_name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="flex-1 truncate font-medium text-slate-700">
                {club.first_name}
              </span>
            </button>
          ))}

          {/* Infinite scroll sentinel — IntersectionObserver target */}
          <div ref={sentinelRef} />

          {/* Loading spinner */}
          {loading && (
            <div className="flex items-center justify-center py-3">
              <Loader2
                className="h-4 w-4 animate-spin"
                style={{ color: "#a78bfa" }}
              />
            </div>
          )}

          {/* Empty state */}
          {!loading && items.length === 0 && (
            <div className="px-3 py-5 text-center text-sm text-slate-400">
              {query.trim()
                ? `No clubs found for "${query}"`
                : "No clubs found"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
