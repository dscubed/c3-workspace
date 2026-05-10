"use client";

import { useEventForm } from "../shared/EventFormContext";
import { DateDisplay } from "../preview/date-location/DateDisplay";
import { getEffectiveDates } from "@/lib/schemas/event";

export function EventDateField() {
  const { form } = useEventForm();
  const dates = getEffectiveDates(form.occurrences);
  return (
    <DateDisplay
      value={{
        startDate: dates.startDate,
        startTime: dates.startTime,
        endDate: dates.endDate,
        endTime: dates.endTime,
        timezone: form.timezone,
        extraOccurrences:
          form.occurrences.length > 1 ? form.occurrences.length - 1 : undefined,
      }}
    />
  );
}
