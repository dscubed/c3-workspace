"use client";

import { useEventForm } from "../shared/EventFormContext";
import { LocationDisplay } from "../preview/LocationDisplay";
import { getLocationInfo } from "@/lib/schemas/event";

export function EventLocationField() {
  const { form } = useEventForm();
  const realVenues = form.venues.filter((v) => v.type !== "tba");
  const extraVenues = realVenues.length > 1 ? realVenues.length - 1 : undefined;
  const { location } = getLocationInfo(form.venues);
  return <LocationDisplay value={location} extraVenues={extraVenues} />;
}
