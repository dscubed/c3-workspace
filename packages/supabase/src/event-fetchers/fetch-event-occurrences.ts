import { supabaseAdmin } from "../admin";

export interface OccurrenceRow {
  id: string;
  name: string | null;
  start: string;
  end: string | null;
  event_occurrence_venues?: { venue_id: string }[] | null;
}

export async function fetchEventOccurrences(
  eventId: string,
): Promise<OccurrenceRow[]> {
  const { data } = await supabaseAdmin
    .from("event_occurrences")
    .select("id, name, start, end, event_occurrence_venues(venue_id)")
    .eq("event_id", eventId)
    .order("start");

  return data ?? [];
}
