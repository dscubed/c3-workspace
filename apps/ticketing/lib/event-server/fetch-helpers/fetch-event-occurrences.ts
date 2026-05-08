import { supabaseAdmin } from "@c3/supabase";

export interface OccurrenceRow {
  id: string;
  name: string | null;
  start: string;
  end: string | null;
  venue_ids: string[] | null;
}

export async function fetchEventOccurrences(
  eventId: string,
): Promise<OccurrenceRow[]> {
  const { data } = await supabaseAdmin
    .from("event_occurrences")
    .select("*")
    .eq("event_id", eventId)
    .order("start");

  return data ?? [];
}
