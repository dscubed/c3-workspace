"use client";

import { useMemo } from "react";
import { CalendarDays, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { OccurrenceFormData, Venue } from "../../../shared/types";
import {
  formatDateFull,
  formatTimeRange,
  venueLabel,
  venueIcon,
} from "../occurrenceUtils";

interface OccurrenceListProps {
  occurrences: OccurrenceFormData[];
  venues: Venue[];
  onSelect: (occ: OccurrenceFormData) => void;
  onAdd: () => void;
}

export function OccurrenceList({
  occurrences,
  venues,
  onSelect,
  onAdd,
}: OccurrenceListProps) {
  const sorted = useMemo(
    () =>
      [...occurrences].sort(
        (a, b) =>
          a.startDate.localeCompare(b.startDate) ||
          a.startTime.localeCompare(b.startTime),
      ),
    [occurrences],
  );

  const venueMap = useMemo(() => {
    const m = new Map<string, Venue>();
    for (const v of venues) m.set(v.id, v);
    return m;
  }, [venues]);

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
        <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
        <div>
          <p className="text-sm font-medium">No occurrences yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Click a date on the calendar or use the button below to add one.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onAdd}>
          Add occurrence
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {sorted.length} occurrence{sorted.length !== 1 ? "s" : ""}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={onAdd}
        >
          Add
        </Button>
      </div>

      <div className="max-h-[50vh] space-y-1.5 overflow-y-auto pr-1">
        {sorted.map((occ) => {
          const occVenues = occ.venueIds
            ?.map((vid) => venueMap.get(vid))
            .filter(Boolean) as Venue[] | undefined;

          return (
            <button
              key={occ.id}
              type="button"
              onClick={() => onSelect(occ)}
              className="group flex w-full flex-col gap-1 rounded-md border px-3 py-2 text-left transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  {occ.name && (
                    <span className="block truncate text-sm font-semibold">
                      {occ.name}
                    </span>
                  )}
                  <span className="text-sm font-medium">
                    {formatDateFull(occ.startDate)}
                  </span>
                </div>
                <Pencil className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <span className="text-xs text-muted-foreground">
                {formatTimeRange(occ.startTime, occ.endTime)}
              </span>
              {occVenues && occVenues.length > 0 && (
                <div className="mt-0.5 flex flex-wrap gap-1">
                  {occVenues.map((v) => (
                    <span
                      key={v.id}
                      className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {venueIcon(v)}
                      {venueLabel(v)}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
