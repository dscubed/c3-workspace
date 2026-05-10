"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, X } from "lucide-react";
import type { ClubProfile } from "../../shared/types";

export interface StagedInvitesListProps {
  staged: ClubProfile[];
  onRemove: (club: ClubProfile) => void;
}

export function StagedInvitesList({
  staged,
  onRemove,
}: StagedInvitesListProps) {
  if (staged.length === 0) return null;

  return (
    <div className="space-y-1">
      <p className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        New Invites ({staged.length})
      </p>
      {staged.map((club) => (
        <div
          key={club.id}
          className="flex items-center gap-2 rounded-md bg-primary/5 px-2 py-1.5"
        >
          <Avatar className="h-7 w-7">
            {club.avatar_url && (
              <AvatarImage src={club.avatar_url} alt={club.first_name} />
            )}
            <AvatarFallback className="text-[10px]">
              {club.first_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="flex-1 truncate text-sm">{club.first_name}</span>
          <Badge variant="outline" className="gap-1 text-[10px]">
            <Mail className="h-3 w-3" />
          </Badge>
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onRemove(club)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
}
