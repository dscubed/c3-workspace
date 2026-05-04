"use client";

import type { FetchedEventData } from "@/lib/api/fetchEvent";
import { EventFormDataProvider } from "./EventFormContext";
import { EventCollabProvider } from "./EventCollabContext";
import { EventEditorProvider } from "./EventEditorContext";

interface EventFormProvidersProps {
  data?: FetchedEventData;
  eventId?: string;
  mode?: "preview";
  children: React.ReactNode;
}

/**
 * Composes EventFormDataProvider → EventCollabProvider → EventEditorProvider.
 * Each provider reads from the ones above it via context hooks.
 * EventForm itself stays thin — just JSX.
 */
export function EventFormProviders({
  data,
  eventId,
  mode,
  children,
}: EventFormProvidersProps) {
  const isVisitorPreview = mode === "preview";

  return (
    <EventFormDataProvider
      data={data}
      eventId={eventId}
      isVisitorPreview={isVisitorPreview}
    >
      <EventCollabProvider
        eventId={eventId}
        isVisitorPreview={isVisitorPreview}
      >
        <EventEditorProvider
          eventId={eventId}
          initialStatus={data?.status ?? "draft"}
          initialTicketingEnabled={data?.ticketingEnabled ?? false}
          initialUrlSlug={data?.urlSlug ?? null}
          isVisitorPreview={isVisitorPreview}
        >
          {children}
        </EventEditorProvider>
      </EventCollabProvider>
    </EventFormDataProvider>
  );
}
