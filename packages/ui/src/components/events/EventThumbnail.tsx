import { Camera } from "lucide-react";
import Image from "next/image";
import { EventCardDetails } from "@c3/types";

export function EventThumbnail({ event }: { event: EventCardDetails }) {
  return (
    <div className="relative rounded-xl overflow-hidden flex items-center justify-center" style={{ width: "100%", height: "100%", background: "linear-gradient(to bottom right, #f3e8ff, #e9d5ff)" }}>
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
