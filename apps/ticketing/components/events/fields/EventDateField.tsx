"use client";

import { useEventForm } from "../shared/EventFormContext";
import { DateDisplay } from "../preview/DateDisplay";

export function EventDateField() {
  const { form } = useEventForm();
  return (
    <DateDisplay
      value={{
        startDate: form.startDate,
        startTime: form.startTime,
        endDate: form.endDate,
        endTime: form.endTime,
        timezone: form.timezone,
        extraOccurrences:
          form.occurrences.length > 1 ? form.occurrences.length - 1 : undefined,
      }}
    />
  );
}
