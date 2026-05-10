"use client";

import { Globe, MapPin, Pencil, Trash2 } from "lucide-react";
import type { Venue } from "../../shared/types";
import { venueLabel } from "./occurrenceUtils";

function venueTypeLabel(type: Venue["type"]): string {
  switch (type) {
    case "physical": return "Physical";
    case "custom":   return "Custom";
    case "online":   return "Online";
    case "tba":      return "TBA";
  }
}

interface VenueCardProps {
  venue: Venue;
  onEdit: () => void;
  onRemove: () => void;
}

export function VenueCard({ venue, onEdit, onRemove }: VenueCardProps) {
  return (
    <div className="group flex items-start justify-between gap-2 rounded-md border bg-muted/30 px-3 py-2.5 transition-colors hover:bg-muted/50">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          {venue.type === "online" ? (
            <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          )}
          <span className="truncate text-sm font-medium">
            {venueLabel(venue)}
          </span>
          <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {venueTypeLabel(venue.type)}
          </span>
        </div>
        {venue.type !== "online" &&
          venue.type !== "tba" &&
          venue.location.address && (
            <p className="mt-0.5 truncate pl-5 text-xs text-muted-foreground">
              {venue.location.address}
            </p>
          )}
      </div>
      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={onEdit}
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-background hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
