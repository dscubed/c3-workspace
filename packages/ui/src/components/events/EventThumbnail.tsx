import { Camera } from "lucide-react";
import Image from "next/image";
import { EventCardDetails } from "@c3/types";

export function EventThumbnail({ event }: { event: EventCardDetails }) {
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
    </div>
  );
}
