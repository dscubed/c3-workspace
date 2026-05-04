"use client";

import Image from "next/image";
import { Check, ChevronDown } from "lucide-react";
import { useClubStore } from "@c3/auth";
import { Skeleton } from "./skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

function ClubAvatar({
  avatarUrl,
  name,
}: {
  avatarUrl: string | null;
  name: string;
}) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={28}
        height={28}
        className="h-7 w-7 rounded-full object-cover shrink-0"
        unoptimized
      />
    );
  }
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-900 text-white text-xs font-semibold shrink-0">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

/**
 * Shared club selector dropdown for use in dashboard navbars.
 * Reads from and writes to `useClubStore` — no props needed.
 * Place this in the navbar/header of any dashboard layout.
 */
export function ClubSelectorDropdown() {
  const { clubs, activeClubId, setActiveClubId, clubsLoading } = useClubStore();

  const activeClub = clubs.find((c) => c.club_id === activeClubId);
  const multipleClubs = clubs.length > 1;

  if (clubsLoading) {
    return (
      <div className="flex items-center gap-2.5">
        <Skeleton className="h-7 w-7 rounded-full" />
        <Skeleton className="h-4 w-40" />
      </div>
    );
  }

  if (!activeClub) return null;

  const clubContent = (
    <div className="flex items-center gap-2.5">
      <ClubAvatar
        avatarUrl={activeClub.club?.avatar_url ?? null}
        name={activeClub.club?.first_name ?? "?"}
      />
      <span className="text-sm font-medium text-foreground">
        {activeClub.club?.first_name}
      </span>
      <span className="text-xs text-muted-foreground capitalize px-1.5 py-0.5 bg-gray-100 rounded">
        {activeClub.role}
      </span>
      {multipleClubs && (
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
      )}
    </div>
  );

  if (!multipleClubs) {
    return <div>{clubContent}</div>;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center hover:opacity-80 transition-opacity cursor-pointer">
          {clubContent}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {clubs.map((row) => (
          <DropdownMenuItem
            key={row.club_id}
            onClick={() => setActiveClubId(row.club_id)}
            className="flex items-center gap-2"
          >
            <ClubAvatar
              avatarUrl={row.club?.avatar_url ?? null}
              name={row.club?.first_name ?? "?"}
            />
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-sm truncate">{row.club?.first_name}</span>
              <span className="text-xs text-muted-foreground capitalize">
                {row.role}
              </span>
            </div>
            {row.club_id === activeClubId && (
              <Check className="h-3.5 w-3.5 text-[#854ECB] shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
