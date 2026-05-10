"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { Venue } from "../../../shared/types";
import { venueLabel, venueIcon } from "../occurrenceUtils";

interface VenuePickerProps {
  venues: Venue[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function VenuePicker({
  venues,
  selectedIds,
  onChange,
}: VenuePickerProps) {
  if (venues.length === 0) {
    return (
      <p className="text-xs italic text-muted-foreground">
        No venues added yet. Add venues in the Date &amp; Location section.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {venues.map((v) => (
        <label
          key={v.id}
          className="flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-2 text-sm transition-colors hover:bg-muted/50"
        >
          <Checkbox
            checked={selectedIds.includes(v.id)}
            onCheckedChange={(c) =>
              onChange(
                c
                  ? [...selectedIds, v.id]
                  : selectedIds.filter((id) => id !== v.id),
              )
            }
          />
          <span className="flex min-w-0 items-center gap-1.5">
            {venueIcon(v)}
            <span className="truncate">{venueLabel(v)}</span>
          </span>
        </label>
      ))}
    </div>
  );
}
