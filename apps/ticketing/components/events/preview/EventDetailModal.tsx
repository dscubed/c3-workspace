"use client";

import { useMemo } from "react";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CalendarDays } from "lucide-react";
import type { DateTimeData, OccurrenceFormData, Venue } from "../shared/types";
import { useEventEditor } from "../shared/EventEditorContext";
import { VenueAccordionItem, VenueInlineList } from "./VenueDetail";
import {
  formatDateFull,
  formatTimeRange,
  getTzAbbrev,
} from "./eventDetailHelpers";

interface EventDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventDetailModal({
  open,
  onOpenChange,
}: EventDetailModalProps) {
  const { form } = useEventEditor();
  const venues: Venue[] = form.venues;
  const occurrences: OccurrenceFormData[] = form.occurrences;

  const dateTime = useMemo<DateTimeData>(
    () => ({
      startDate: form.startDate,
      startTime: form.startTime,
      endDate: form.endDate,
      endTime: form.endTime,
      timezone: form.timezone,
    }),
    [form.startDate, form.startTime, form.endDate, form.endTime, form.timezone],
  );
  const realVenues = useMemo(
    () => venues.filter((v) => v.type !== "tba"),
    [venues],
  );
  const displayVenues = realVenues.length > 0 ? realVenues : venues;

  // If no occurrences exist, synthesize one from dateTime for backward compat
  const effectiveOccurrences = useMemo(() => {
    if (occurrences.length > 0) return occurrences;
    if (!dateTime.startDate) return [];
    return [
      {
        id: "legacy-single",
        startDate: dateTime.startDate,
        startTime: dateTime.startTime,
        endDate: dateTime.endDate,
        endTime: dateTime.endTime,
      },
    ] as OccurrenceFormData[];
  }, [occurrences, dateTime]);

  const sortedOccurrences = useMemo(
    () =>
      [...effectiveOccurrences].sort(
        (a, b) =>
          a.startDate.localeCompare(b.startDate) ||
          a.startTime.localeCompare(b.startTime),
      ),
    [effectiveOccurrences],
  );

  const venueMap = useMemo(() => {
    const m = new Map<string, Venue>();
    for (const v of venues) m.set(v.id, v);
    return m;
  }, [venues]);

  const tzAbbrev = getTzAbbrev(dateTime.timezone);

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="Event details"
      className="max-w-lg"
    >
      <div className="overflow-y-auto max-h-[70vh] pr-1">
        {sortedOccurrences.length === 0 ? (
          /* No date info at all */
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Date to be announced
              </p>
            </div>
            <Accordion type="multiple" className="w-full">
              {displayVenues.map((v) => (
                <VenueAccordionItem key={v.id} venue={v} itemValue={v.id} />
              ))}
            </Accordion>
          </div>
        ) : sortedOccurrences.length === 1 ? (
          /* Single occurrence — flat layout */
          (() => {
            const occ = sortedOccurrences[0];
            const occVenueIds = occ.venueIds ?? [];
            const occVenues = occVenueIds
              .map((vid) => venueMap.get(vid))
              .filter(Boolean) as Venue[];
            const shownVenues =
              occVenues.length > 0 ? occVenues : displayVenues;

            return (
              <div className="space-y-2">
                {/* Optional name header */}
                {occ.name && (
                  <p className="text-base font-semibold">{occ.name}</p>
                )}

                {/* Date */}
                <div className="flex items-start gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">
                      {formatDateFull(occ.startDate)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeRange(occ.startTime, occ.endTime)}
                      {tzAbbrev && ` ${tzAbbrev}`}
                    </p>
                    {occ.endDate && occ.endDate !== occ.startDate && (
                      <p className="text-xs text-muted-foreground">
                        Ends {formatDateFull(occ.endDate)}
                      </p>
                    )}
                  </div>
                </div>
                <Accordion type="multiple" className="w-full">
                  {shownVenues.map((v) => (
                    <VenueAccordionItem key={v.id} venue={v} itemValue={v.id} />
                  ))}
                </Accordion>
              </div>
            );
          })()
        ) : (
          /* Multiple occurrences — accordion */
          <Accordion type="multiple" className="w-full">
            {sortedOccurrences.map((occ, i) => {
              const occVenueIds = occ.venueIds ?? [];
              const occVenues = occVenueIds
                .map((vid) => venueMap.get(vid))
                .filter(Boolean) as Venue[];
              const shownVenues =
                occVenues.length > 0 ? occVenues : displayVenues;

              return (
                <AccordionItem key={occ.id} value={occ.id}>
                  <AccordionTrigger className="py-2.5 text-sm hover:no-underline">
                    <div className="flex items-center gap-2 text-left">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium shrink-0">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="font-semibold block truncate">
                          {occ.name && `${occ.name} - `}
                          {formatDateFull(occ.startDate)}
                        </span>
                        <span className="text-xs text-muted-foreground block">
                          {formatTimeRange(occ.startTime, occ.endTime)}
                          {tzAbbrev && ` ${tzAbbrev}`}
                        </span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3 pl-7">
                    {occ.endDate && occ.endDate !== occ.startDate && (
                      <p className="mb-2 text-xs text-muted-foreground">
                        Ends {formatDateFull(occ.endDate)}
                      </p>
                    )}
                    <VenueInlineList venues={shownVenues} />
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>
    </ResponsiveModal>
  );
}
