import { supabaseAdmin } from "@c3/supabase";
import { fetchEventServer, PublicEventData } from "./fetchEventServer";
import { fetchEventRow } from "./fetch-helpers/fetch-event-row";

/**
 * Resolve an event by ID or url_slug.
 * Uses fetchEventRow (1 table) for ID check, only doing the full
 * 8-table fetch after we've confirmed the event exists.
 */
export async function resolveEventByIdOrSlug(
  param: string,
  options: { requirePublished?: boolean } = {},
): Promise<PublicEventData | null> {
  const reqPub = options.requirePublished !== false;

  const row = await fetchEventRow(param);
  if (row && (!reqPub || row.status === "published")) {
    return fetchEventServer(param, options);
  }

  const slugQuery = supabaseAdmin
    .from("events")
    .select("id")
    .eq("url_slug", param);

  if (reqPub) slugQuery.eq("status", "published");

  const { data } = await slugQuery.maybeSingle();
  if (!data) return null;

  return fetchEventServer(data.id, options);
}
