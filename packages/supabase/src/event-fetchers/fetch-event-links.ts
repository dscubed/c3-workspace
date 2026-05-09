import { supabaseAdmin } from "../admin";

export interface LinkRow {
  id: string;
  url: string;
  title: string | null;
  sort_order: number;
}

export async function fetchEventLinks(eventId: string): Promise<LinkRow[]> {
  const { data } = await supabaseAdmin
    .from("event_links")
    .select("id, url, title, sort_order")
    .eq("event_id", eventId)
    .order("sort_order");

  return data ?? [];
}
