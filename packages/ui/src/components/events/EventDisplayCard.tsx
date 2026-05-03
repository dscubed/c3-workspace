import { EventCardDetails } from "@c3/types";
import { EventThumbnail } from "./EventThumbnail";
import { HostStack } from "../host-stack";
import { Globe, MapPin } from "lucide-react";
import { formatDateTBA } from "@c3/utils";

export function EventDisplayCard({
  event,
  menu,
  content,
  onClick,
}: {
  event: EventCardDetails;
  menu?: React.ReactNode;
  content?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div className="relative flex gap-4 group">
      {/* Square thumbnail */}
      <div className="w-[110px] shrink-0 cursor-pointer" onClick={onClick}>
        <EventThumbnail event={event} />
      </div>

      {/* Details */}
      <div className="flex flex-col justify-center gap-1 min-w-0 flex-1 pr-7">
        <p className="text-xs font-semibold text-muted-foreground tracking-wide uppercase">
          {formatDateTBA(event.start)}
        </p>
        <p
          className="text-sm font-bold text-foreground leading-snug group-hover:text-[#854ECB] transition-colors line-clamp-2 cursor-pointer"
          onClick={onClick}
        >
          {event.name || "Untitled Event"}
        </p>
        <HostStack organizers={[event.host, ...(event.collaborators ?? [])]} />
        <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
          {event.is_online ? (
            <Globe className="h-3 w-3 shrink-0" />
          ) : (
            <MapPin className="h-3 w-3 shrink-0" />
          )}
          {event.is_online ? "Online" : event.location_name || "TBA"}
        </p>

        {content && <div className="mt-1.5">{content}</div>}
      </div>

      {/* 3-dot menu — absolute top-right */}
      {menu && <div className="absolute top-0 right-0">{menu}</div>}
    </div>
  );
}
