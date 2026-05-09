import { supabaseAdmin } from "../admin";

export interface VenueRow {
  id: string;
  type: string;
  venue: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  online_link: string | null;
  sort_order: number;
}

export async function fetchEventVenues(eventId: string): Promise<VenueRow[]> {
  const { data } = await supabaseAdmin
    .from("event_venues")
    .select("*")
    .eq("event_id", eventId)
    .order("sort_order");

  return data ?? [];
}
