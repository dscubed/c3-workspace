"use client";

import { Calendar, MapPin, Receipt } from "lucide-react";
import type { RegistrationWithEvent } from "@c3/types";

interface OrderRowProps {
  registration: RegistrationWithEvent;
}

export function OrderRow({ registration }: OrderRowProps) {
  const isPaid =
    registration.type === "ticket" && !!registration.stripe_session_id;

  const eventDate = registration.event_start
    ? new Date(registration.event_start).toLocaleDateString("en-AU", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  return (
    <div className="flex items-center gap-4 px-4 py-4 hover:bg-gray-50 transition-colors">
      {/* Event thumbnail */}
      <div className="w-14 h-14 rounded-lg overflow-hidden bg-purple-100 shrink-0">
        {registration.event_thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={registration.event_thumbnail}
            alt={registration.event_name ?? "Event"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-purple-300 text-xs">No img</span>
          </div>
        )}
      </div>

      {/* Event details */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">
          {registration.event_name ?? "Event"}
        </p>
        {eventDate && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <Calendar className="size-3" />
            {eventDate}
          </p>
        )}
        {registration.event_venue && (
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
            <MapPin className="size-3" />
            {registration.event_venue}
          </p>
        )}
      </div>

      {/* Price / receipt */}
      <div className="flex items-center gap-2 shrink-0">
        {isPaid ? (
          <button
            disabled
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 text-muted-foreground cursor-not-allowed opacity-60"
          >
            <Receipt className="size-3.5" />
            Receipt
          </button>
        ) : (
          <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
            Free
          </span>
        )}
      </div>
    </div>
  );
}
