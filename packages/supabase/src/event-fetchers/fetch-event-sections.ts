import { supabaseAdmin } from "../admin";

export interface SectionRow {
  id: string;
  type: string;
  data: unknown;
  sort_order: number;
}

export async function fetchEventSections(eventId: string): Promise<SectionRow[]> {
  const { data } = await supabaseAdmin
    .from("event_sections")
    .select("id, type, data, sort_order")
    .eq("event_id", eventId)
    .order("sort_order");

  return data ?? [];
}
