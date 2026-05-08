"use client";

import EventForm from "@/components/event-form/EventForm";
import type { FetchedEventData } from "@/lib/api/fetchEvent";

/**
 * Renders the event form with data already fetched server-side.
 * Auth verification + data fetching happens in page.tsx.
 */
export default function EditEventClient({
  eventId,
  data,
}: {
  eventId: string;
  data: FetchedEventData;
}) {
  return <EventForm eventId={eventId} data={data} />;
}
