import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDateTBA } from "@c3/utils";
import { CalendarDays, Check, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface InviteEvent {
  id: string;
  name: string | null;
  start: string | null;
  status: string;
  event_images: { url: string; sort_order: number }[] | null;
}

interface InvitePerson {
  id: string;
  first_name: string;
  last_name: string | null;
  avatar_url: string | null;
}

export interface Invite {
  id: string;
  event_id: string;
  status: string;
  created_at: string;
  events: InviteEvent | null;
  inviter: InvitePerson | null;
  invitee: InvitePerson | null;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

/* ── Request card ── */
export function RequestCard({
  invite,
  direction,
  onAction,
}: {
  invite: Invite;
  direction: "incoming" | "outgoing";
  onAction: (id: string, action: "accept" | "decline" | "cancel") => void;
}) {
  const [busy, setBusy] = useState(false);
  const event = invite.events;
  const thumbnail =
    event?.event_images?.sort((a, b) => a.sort_order - b.sort_order)[0]?.url ??
    null;
  const primaryPerson =
    direction === "incoming" ? invite.inviter : invite.invitee;
  const senderPerson = direction === "outgoing" ? invite.inviter : null;

  const act = async (action: "accept" | "decline" | "cancel") => {
    setBusy(true);
    await onAction(invite.id, action);
    setBusy(false);
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-gray-200 bg-white">
      {/* Event thumbnail */}
      <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={event?.name ?? ""}
            fill
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-gray-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {event?.name ?? "Untitled Event"}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDateTBA(event?.start ?? null)}
        </p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {primaryPerson && (
            <>
              <Avatar className="h-4 w-4 shrink-0">
                {primaryPerson.avatar_url && (
                  <AvatarImage
                    src={primaryPerson.avatar_url}
                    alt={primaryPerson.first_name}
                  />
                )}
                <AvatarFallback className="text-[8px] bg-purple-100 text-purple-700">
                  {primaryPerson.first_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <p className="text-xs text-muted-foreground truncate">
                {direction === "incoming" ? "from" : "to"}{" "}
                <span className="font-medium text-foreground">
                  {primaryPerson.first_name} {primaryPerson.last_name ?? ""}
                </span>
              </p>
            </>
          )}
          {senderPerson && (
            <>
              <span className="text-muted-foreground/40 text-xs shrink-0">
                ·
              </span>
              <Avatar className="h-4 w-4 shrink-0">
                {senderPerson.avatar_url && (
                  <AvatarImage
                    src={senderPerson.avatar_url}
                    alt={senderPerson.first_name}
                  />
                )}
                <AvatarFallback className="text-[8px] bg-purple-100 text-purple-700">
                  {senderPerson.first_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <p className="text-xs text-muted-foreground truncate">
                sent by{" "}
                <span className="font-medium text-foreground">
                  {senderPerson.first_name} {senderPerson.last_name ?? ""}
                </span>
              </p>
            </>
          )}
          <span className="text-muted-foreground/40 text-xs shrink-0">·</span>
          <p className="text-xs text-muted-foreground shrink-0">
            {timeAgo(invite.created_at)}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {direction === "incoming" ? (
          <>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700 border-green-200"
              disabled={busy}
              onClick={() => act("accept")}
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
              disabled={busy}
              onClick={() => act("decline")}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="text-xs text-muted-foreground"
            disabled={busy}
            onClick={() => act("cancel")}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
