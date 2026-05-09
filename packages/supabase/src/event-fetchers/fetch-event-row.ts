import { supabaseAdmin } from "../admin";

export interface EventRow {
  id: string;
  name: string | null;
  description: string | null;
  timezone: string | null;
  is_online: boolean;
  category: string | null;
  tags: string[] | null;
  status: string;
  url_slug: string | null;
  creator_profile_id: string;
  event_capacity: number | null;
  location_type: string | null;
  theme_mode: string;
  theme_layout: string;
  theme_accent: string;
  theme_accent_custom: string | null;
  theme_bg_color: string | null;
}

export async function fetchEventRow(eventId: string): Promise<EventRow | null> {
  const { data, error } = await supabaseAdmin
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  if (error || !data) return null;
  return data as unknown as EventRow;
}
