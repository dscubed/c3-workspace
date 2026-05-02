"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  MailX,
  RefreshCw,
  UserMinus,
} from "lucide-react";
import type { ClubProfile } from "../shared/types";

export interface InviteRecord {
  id: string;
  invitee_id: string;
  status: "pending" | "accepted" | "declined";
  profiles: ClubProfile | null;
}

export interface CollaboratorListProps {
  creatorProfile: ClubProfile;
  invites: InviteRecord[];
  invitesLoading: boolean;
  actionLoading: string | null;
  onCancelInvite: (id: string) => void;
  onRemoveCollaborator: (id: string) => void;
  onResendInvite: (id: string) => void;
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

export function CollaboratorList({
  creatorProfile,
  invites,
  invitesLoading,
  actionLoading,
  onCancelInvite,
  onRemoveCollaborator,
  onResendInvite,
}: CollaboratorListProps) {
  return (
    <div className="space-y-1">
      <p className="px-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Current Collaborators
      </p>

      {/* Creator — always pinned */}
      <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
        <Avatar className="h-7 w-7">
          {creatorProfile.avatar_url && (
            <AvatarImage
              src={creatorProfile.avatar_url}
              alt={creatorProfile.first_name}
            />
          )}
          <AvatarFallback className="text-[10px]">
            {creatorProfile.first_name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="flex-1 truncate text-sm font-medium">
          {creatorProfile.first_name}
        </span>
        <Badge variant="secondary" className="text-[10px]">
          Owner
        </Badge>
      </div>

      {/* Existing invited collaborators */}
      {invites.map((invite) => {
        const profile = invite.profiles;
        if (!profile) return null;
        const isActioning = actionLoading === invite.invitee_id;

        return (
          <div
            key={invite.id}
            className="flex items-center gap-2 rounded-md px-2 py-1.5"
          >
            <Avatar className="h-7 w-7">
              {profile.avatar_url && (
                <AvatarImage
                  src={profile.avatar_url}
                  alt={profile.first_name}
                />
              )}
              <AvatarFallback className="text-[10px]">
                {profile.first_name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="flex-1 truncate text-sm">
              {profile.first_name}
            </span>
            <StatusBadge status={invite.status} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  disabled={isActioning}
                  className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                >
                  {isActioning ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <MoreHorizontal className="h-3.5 w-3.5" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                {invite.status === "pending" && (
                  <DropdownMenuItem
                    onClick={() => onCancelInvite(invite.invitee_id)}
                  >
                    <MailX className="h-4 w-4" />
                    Cancel Invite
                  </DropdownMenuItem>
                )}
                {invite.status === "accepted" && (
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onRemoveCollaborator(invite.invitee_id)}
                  >
                    <UserMinus className="h-4 w-4" />
                    Remove
                  </DropdownMenuItem>
                )}
                {invite.status === "declined" && (
                  <DropdownMenuItem
                    onClick={() => onResendInvite(invite.invitee_id)}
                  >
                    <RefreshCw className="h-4 w-4" />
                    Resend Invite
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      })}

      {invitesLoading && (
        <div className="flex justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {!invitesLoading && invites.length === 0 && (
        <p className="px-2 py-1.5 text-sm text-muted-foreground">
          No collaborators yet.
        </p>
      )}
    </div>
  );
}
