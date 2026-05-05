import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import type { EventRegistration } from "@c3/types";

export function useEventRegistrations(eventId: string | null) {
  const { data, isLoading, error, mutate } = useSWR<EventRegistration[]>(
    eventId ? `/api/events/${eventId}/registrations` : null,
    fetcher,
  );

  return {
    registrations: data ?? [],
    isLoading,
    error,
    mutate,
  };
}
