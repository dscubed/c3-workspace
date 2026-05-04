"use client";

import { useEventForm } from "../shared/EventFormContext";
import { LocationDisplay } from "../preview/LocationDisplay";

export function EventLocationField() {
  const { form } = useEventForm();
  const realVenues = form.venues.filter((v) => v.type !== "tba");
  const extraVenues = realVenues.length > 1 ? realVenues.length - 1 : undefined;
  return <LocationDisplay value={form.location} extraVenues={extraVenues} />;
}
