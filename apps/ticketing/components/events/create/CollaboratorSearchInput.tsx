"use client";

import { useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Loader2,
  X,
  UserPlus,
  Check,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { ClubProfile } from "../shared/types";

export type InviteStatus = "pending" | "accepted" | "declined";

export interface CollaboratorSearchInputProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchFocused: boolean;
  onFocusChange: (focused: boolean) => void;
  clubs: ClubProfile[];
  loading: boolean;
  creatorProfile: ClubProfile;
  stagedIds: Set<string>;
  selectedHosts: string[];
  selectedHostsData: ClubProfile[];
  getInviteStatus: (id: string) => InviteStatus | undefined;
  toggleStaged: (club: ClubProfile) => void;
  toggleHost: (club: ClubProfile) => void;
  onScrollEnd: () => void;
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="outline" className="gap-1 text-[10px]">
          <Clock className="h-3 w-3" /> Pending
        </Badge>
      );
    case "accepted":
      return (
        <Badge variant="default" className="gap-1 text-[10px]">
          <CheckCircle2 className="h-3 w-3" /> Accepted
        </Badge>
      );
    case "declined":
      return (
        <Badge variant="destructive" className="gap-1 text-[10px]">
          <XCircle className="h-3 w-3" /> Declined
        </Badge>
      );
    default:
      return null;
  }
}

export function CollaboratorSearchInput({
  search,
  onSearchChange,
  searchFocused,
  onFocusChange,
  clubs,
  loading,
  creatorProfile,
  stagedIds,
  selectedHosts,
  selectedHostsData,
  getInviteStatus,
  toggleStaged,
  toggleHost,
  onScrollEnd,
}: CollaboratorSearchInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollHeight - scrollTop - clientHeight < 40) {
      onScrollEnd();
    }
  };

  const showDropdown = searchFocused && search.trim().length > 0;
  const filteredClubs = clubs.filter((c) => c.id !== creatorProfile.id);

  return (
    <div ref={containerRef} className="relative">
      {/* Search input */}
      <div className="flex items-center gap-2 rounded-md border bg-background px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search clubs..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => onFocusChange(true)}
          onBlur={(e) => {
            if (!containerRef.current?.contains(e.relatedTarget as Node)) {
              setTimeout(() => onFocusChange(false), 150);
            }
          }}
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          autoFocus
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange("")}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Floating dropdown */}
      {showDropdown && (
        <div
          ref={listRef}
          onScroll={handleScroll}
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md"
        >
          {filteredClubs.map((club) => {
            const inviteStatus = getInviteStatus(club.id);
            const isStaged = stagedIds.has(club.id);
            const isHost = selectedHosts.includes(club.id);
            const isDisabled = !!inviteStatus;

            return (
              <button
                key={club.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => !isDisabled && toggleStaged(club)}
                disabled={isDisabled}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border ${
                    isStaged
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {isStaged && <Check className="h-3 w-3" />}
                </div>
                <Avatar className="h-6 w-6">
                  {club.avatar_url && (
                    <AvatarImage src={club.avatar_url} alt={club.first_name} />
                  )}
                  <AvatarFallback className="text-[9px]">
                    {club.first_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate">{club.first_name}</span>
                {inviteStatus && <StatusBadge status={inviteStatus} />}
                {isHost && !inviteStatus && (
                  <Badge variant="secondary" className="text-[10px]">
                    Host
                  </Badge>
                )}
              </button>
            );
          })}

          {/* Custom display host creation */}
          {!loading &&
            (() => {
              const trimmed = search.trim();
              const alreadyExists =
                filteredClubs.some(
                  (c) => c.first_name.toLowerCase() === trimmed.toLowerCase(),
                ) ||
                selectedHostsData.some(
                  (c) => c.first_name.toLowerCase() === trimmed.toLowerCase(),
                ) ||
                creatorProfile.first_name.toLowerCase() ===
                  trimmed.toLowerCase();
              if (alreadyExists) return null;
              return (
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    const customClub: ClubProfile = {
                      id: `custom-${Date.now()}`,
                      first_name: trimmed,
                      avatar_url: null,
                    };
                    toggleHost(customClub);
                    onSearchChange("");
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                >
                  <UserPlus className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">
                    Add &ldquo;
                    <span className="font-medium">{trimmed}</span>&rdquo; as
                    display host
                  </span>
                </button>
              );
            })()}

          {loading && (
            <div className="flex justify-center py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && filteredClubs.length === 0 && (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              No clubs found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
