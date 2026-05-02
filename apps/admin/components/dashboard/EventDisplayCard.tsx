"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { MapPin, Camera, Globe } from "lucide-react";
import { formatDateTBA } from "../shared/utils";
import type { EventCardDetails, AvatarProfile } from "@/lib/types/events";

function OrgAvatar({ p, size }: { p: AvatarProfile; size: number }) {
  const initials = p.first_name.charAt(0).toUpperCase();
  if (p.avatar_url) {
    return (
      <img
        src={p.avatar_url}
        alt={p.first_name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover shrink-0 ring-2 ring-white"
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-purple-100 ring-2 ring-white"
      style={{ width: size, height: size }}
    >
      <span className="font-semibold text-purple-600" style={{ fontSize: size * 0.4 }}>
        {initials}
      </span>
    </div>
  );
}

function CollaboratorStack({ organizers }: { organizers: AvatarProfile[] }) {
  if (!organizers.length) return null;
  const size = 18;
  const MAX = 3;
  const shown = organizers.slice(0, MAX);
  const extra = organizers.length - MAX;
  const [first] = organizers;
  const label =
    organizers.length === 1
      ? first.first_name
      : `${first.first_name} + ${organizers.length - 1} other${organizers.length - 1 > 1 ? "s" : ""}`;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {shown.map((p, i) => (
          <div key={p.id} style={{ marginLeft: i === 0 ? 0 : -(size * 0.3) }}>
            <OrgAvatar p={p} size={size} />
          </div>
        ))}
        {extra > 0 && (
          <div
            className="flex shrink-0 items-center justify-center rounded-full bg-gray-200 ring-2 ring-white"
            style={{ width: size, height: size, marginLeft: -(size * 0.3), fontSize: size * 0.35 }}
          >
            <span className="font-semibold text-gray-500">+{extra}</span>
          </div>
        )}
      </div>
      <span className="text-[11px] text-muted-foreground truncate">{label}</span>
    </div>
  );
}


function EventThumbnail({ event }: { event: EventCardDetails }) {
  return (
    <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center shrink-0">
      {event.thumbnail ? (
        <Image
          src={event.thumbnail}
          alt={event.name ?? "Event"}
          fill
          className="object-cover"
        />
      ) : (
        <Camera className="h-8 w-8 text-purple-300" />
      )}

      {event.status === "draft" && (
        <span className="absolute top-2 right-2 text-[10px] font-semibold uppercase tracking-wide bg-amber-400/90 text-amber-900 px-2 py-0.5 rounded-md backdrop-blur-sm">
          Draft
        </span>
      )}
      {event.status === "live" && (
        <span className="absolute top-2 right-2 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide bg-green-500/90 text-white px-2 py-0.5 rounded-md backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
          Live
        </span>
      )}
      {event.status === "upcoming" && (
        <span className="absolute top-2 right-2 text-[10px] font-semibold uppercase tracking-wide bg-blue-500/90 text-white px-2 py-0.5 rounded-md backdrop-blur-sm">
          Upcoming
        </span>
      )}
      {event.status === "past" && (
        <span className="absolute top-2 right-2 text-[10px] font-semibold uppercase tracking-wide bg-gray-500/90 text-white px-2 py-0.5 rounded-md backdrop-blur-sm">
          Past
        </span>
      )}
    </div>
  );
}

export function EventDisplayCard({
  event,
  menu,
  content,
}: {
  event: EventCardDetails;
  menu?: React.ReactNode;
  content?: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="relative flex gap-4 group">
      {/* Square thumbnail */}
      <div
        className="w-[110px] shrink-0 cursor-pointer"
        onClick={() => router.push(`/dashboard/events/${event.id}`)}
      >
        <EventThumbnail event={event} />
      </div>

      {/* Details */}
      <div className="flex flex-col justify-center gap-1 min-w-0 flex-1 pr-7">
        <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
          {formatDateTBA(event.start)}
        </p>
        <p
          className="text-sm font-bold text-foreground leading-snug group-hover:text-[#854ECB] transition-colors line-clamp-2 cursor-pointer"
          onClick={() => router.push(`/dashboard/events/${event.id}`)}
        >
          {event.name || "Untitled Event"}
        </p>
        <CollaboratorStack organizers={[event.host, ...(event.collaborators ?? [])]} />
        <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
          {event.is_online ? (
            <Globe className="h-3 w-3 shrink-0" />
          ) : (
            <MapPin className="h-3 w-3 shrink-0" />
          )}
          {event.is_online ? "Online" : (event.location_name || "TBA")}
        </p>

        {content && <div className="mt-1.5">{content}</div>}
      </div>

      {/* 3-dot menu — absolute top-right */}
      {menu && (
        <div className="absolute top-0 right-0">
          {menu}
        </div>
      )}
    </div>
  );
}
