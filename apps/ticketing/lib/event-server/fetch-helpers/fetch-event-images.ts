import { supabaseAdmin } from "@c3/supabase";

export interface ImageRow {
  id: string;
  url: string;
  sort_order: number;
}

export async function fetchEventImages(eventId: string): Promise<ImageRow[]> {
  const { data } = await supabaseAdmin
    .from("event_images")
    .select("id, url, sort_order")
    .eq("event_id", eventId)
    .order("sort_order");

  return data ?? [];
}
