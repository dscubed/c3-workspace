"use client";

import { useState, useMemo, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { CalendarDays, Info, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OccurrenceEditor } from "./occurence-editor/OccurrenceEditor";
import { useEventForm } from "../../shared/EventFormContext";
import { formatTime12 } from "./occurrenceUtils";
import type { OccurrenceFormData } from "../../shared/types";

const POPULAR_TIMEZONES = [
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Perth",
  "Australia/Adelaide",
  "Pacific/Auckland",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Pacific/Honolulu",
] as const;

function tzLabel(tz: string): string {
  try {
    const now = new Date();
    const short = now.toLocaleString("en-AU", {
      timeZone: tz,
      timeZoneName: "short",
    });
    const parts = short.split(/\s/);
    const abbrev = parts[parts.length - 1] ?? "";
    const city = tz.split("/").pop()?.replace(/_/g, " ") ?? tz;
    return `${city} (${abbrev})`;
  } catch {
    return tz;
  }
}

export function DateSection() {
  const { form, setForm, markDirty } = useEventForm();
  const { timezone, occurrences, venues } = form;

  const [occEditorOpen, setOccEditorOpen] = useState(false);

  const onTimezoneChange = useCallback(
    (tz: string) => {
      setForm((prev) => ({ ...prev, timezone: tz }));
      markDirty("event", "location");
    },
    [setForm, markDirty],
  );

  const onOccurrencesChange = useCallback(
    (occs: OccurrenceFormData[]) => {
      setForm((prev) => ({ ...prev, occurrences: occs }));
      markDirty("event", "occurrences", "location");
    },
    [setForm, markDirty],
  );

  const occurrenceSummary = useMemo(() => {
    if (occurrences.length === 0) return null;
    const sorted = [...occurrences].sort((a, b) =>
      a.startDate.localeCompare(b.startDate),
    );
    const first = sorted[0];
    try {
      const dateStr = format(parseISO(first.startDate), "EEE do MMM yyyy");
      const timeStr = formatTime12(first.startTime);
      const label = first.name
        ? `${first.name} — ${dateStr}`
        : `${dateStr}, ${timeStr}`;
      const rest = sorted.length - 1;
      return `${label}${rest > 0 ? ` + ${rest} more` : ""}`;
    } catch {
      return `${sorted.length} occurrence${sorted.length !== 1 ? "s" : ""}`;
    }
  }, [occurrences]);

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold">
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        Date &amp; time
      </h3>

      <div>
        <Label className="text-xs text-muted-foreground">Timezone</Label>
        <Select value={timezone} onValueChange={onTimezoneChange}>
          <SelectTrigger className="mt-1 w-full sm:w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {POPULAR_TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>
                {tzLabel(tz)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {occurrences.length > 0 && occurrenceSummary ? (
          <button
            type="button"
            onClick={() => setOccEditorOpen(true)}
            className="flex w-full items-center gap-2 rounded-md border bg-muted/50 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
          >
            <span className="flex-1">{occurrenceSummary}</span>
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOccEditorOpen(true)}
          >
            Add date &amp; time
          </Button>
        )}
        {occurrences.length > 1 && (
          <div className="flex items-start gap-2 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:bg-blue-950/30 dark:text-blue-300">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Ticket types, prices, and capacities will apply to all
              occurrences.
            </span>
          </div>
        )}
      </div>

      <OccurrenceEditor
        open={occEditorOpen}
        onOpenChange={setOccEditorOpen}
        occurrences={occurrences}
        timezone={timezone}
        venues={venues}
        onChange={onOccurrencesChange}
      />
    </div>
  );
}
