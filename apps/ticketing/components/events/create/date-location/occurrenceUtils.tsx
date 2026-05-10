import { format, addDays, addWeeks, addMonths, isBefore, isSameDay, parseISO } from "date-fns";
import { Globe, MapPin } from "lucide-react";
import type { OccurrenceFormData, Venue } from "../../shared/types";
import React from "react";

export type Frequency = "once" | "daily" | "weekly" | "monthly";

export interface OccFormState {
  name: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  frequency: Frequency;
  repeatUntil: string;
  venueIds: string[];
}

export const EMPTY_FORM: OccFormState = {
  name: "",
  startDate: "",
  startTime: "",
  endDate: "",
  endTime: "",
  frequency: "once",
  repeatUntil: "",
  venueIds: [],
};

export function formatTime12(time: string): string {
  if (!time) return "";
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function formatTimeRange(startTime: string, endTime: string): string {
  const s = formatTime12(startTime);
  const e = formatTime12(endTime);
  if (s && e) return `${s} - ${e}`;
  if (s) return s;
  return "All day";
}

export function formatChipLabel(occ: OccurrenceFormData): string {
  if (occ.name) return occ.name;
  const s = formatTime12(occ.startTime);
  const e = formatTime12(occ.endTime);
  if (s && e) return `${s} - ${e}`;
  if (s) return s;
  return "All day";
}

export function formatDateFull(dateStr: string): string {
  try {
    return format(parseISO(dateStr), "EEE do MMM yyyy");
  } catch {
    return dateStr;
  }
}

export function venueLabel(venue: Venue): string {
  if (venue.type === "online") return venue.onlineLink || "Online";
  if (venue.type === "tba") return "TBA";
  return venue.location.displayName || "Unnamed venue";
}

export function venueIcon(venue: Venue): React.ReactElement {
  if (venue.type === "online") return React.createElement(Globe, { className: "h-3 w-3 shrink-0" });
  return React.createElement(MapPin, { className: "h-3 w-3 shrink-0" });
}

export function buildRepeatOccurrences(form: OccFormState): OccurrenceFormData[] {
  const { startDate, endDate, startTime, endTime, frequency, repeatUntil, venueIds } = form;
  const until = repeatUntil ? parseISO(repeatUntil) : addMonths(parseISO(startDate), 3);
  const advance =
    frequency === "daily" ? (d: Date) => addDays(d, 1)
    : frequency === "weekly" ? (d: Date) => addWeeks(d, 1)
    : (d: Date) => addMonths(d, 1);
  const dayDiff =
    startDate && endDate && startDate !== endDate
      ? Math.round((parseISO(endDate).getTime() - parseISO(startDate).getTime()) / 86400000)
      : 0;

  const occs: OccurrenceFormData[] = [];
  let current = parseISO(startDate);
  while (isBefore(current, until) || isSameDay(current, until)) {
    occs.push({
      id: crypto.randomUUID(),
      startDate: format(current, "yyyy-MM-dd"),
      startTime,
      endDate: dayDiff > 0 ? format(addDays(current, dayDiff), "yyyy-MM-dd") : "",
      endTime,
      venueIds: venueIds.length > 0 ? venueIds : undefined,
    });
    current = advance(current);
  }
  return occs;
}
