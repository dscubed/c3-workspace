import { supabaseAdmin } from "./admin";
import type { EventCardDetails, AvatarProfile } from "@c3/types";

const EVENT_CARD_SELECT = `
  id,
  name,
  start,
  status,
  category,
  is_online,
  profiles!creator_profile_id(id, first_name, avatar_url),
  event_images(url, sort_order),
  event_venues(type, venue, sort_order)
`;

async function getEventCollaborators(
  eventId: string,
): Promise<AvatarProfile[] | null> {
  const { data, error } = await supabaseAdmin
    .from("event_hosts")
    .select("profile:profile_id(id, first_name, avatar_url)")
    .eq("event_id", eventId)
    .eq("status", "accepted");

  if (error || !data || data.length === 0) return null;

  return data
    .map((row) => {
      const p = row.profile as unknown as AvatarProfile | null;
      if (!p) return null;
      return { id: p.id, first_name: p.first_name, avatar_url: p.avatar_url };
    })
    .filter((p): p is AvatarProfile => p !== null);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function toEventCardDetails(row: any): Promise<EventCardDetails> {
  const collaborators = await getEventCollaborators(row.id);

  const profile = row.profiles as unknown as AvatarProfile;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const images: { url: string; sort_order: number }[] = (
    row.event_images ?? []
  ).sort((a: any, b: any) => a.sort_order - b.sort_order);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const venues: { type: string; venue: string | null; sort_order: number }[] = (
    row.event_venues ?? []
  ).sort((a: any, b: any) => a.sort_order - b.sort_order);
  const primaryVenue =
    venues.find((v) => v.type !== "tba" && v.type !== "online") ?? venues[0];

  return {
    id: row.id,
    name: row.name ?? null,
    start: row.start ?? null,
    status: row.status,
    category: row.category ?? null,
    is_online: row.is_online ?? false,
    location_name: primaryVenue?.venue ?? null,
    thumbnail: images[0]?.url ?? null,
    host: profile
      ? {
          id: profile.id,
          first_name: profile.first_name,
          avatar_url: profile.avatar_url,
        }
      : { id: "", first_name: "Unknown", avatar_url: null },
    collaborators,
  };
}

/**
 * Fetch event cards for a club (admin-side, uses service role).
 * Includes events where the club is the creator OR an accepted co-host.
 * Returns all statuses so admins can see drafts too.
 */
export async function fetchClubEventCards(
  clubId: string,
): Promise<EventCardDetails[]> {
  // Step 1: get event IDs where this club is a co-host
  const { data: hostRows } = await supabaseAdmin
    .from("event_hosts")
    .select("event_id")
    .eq("profile_id", clubId)
    .eq("status", "accepted");

  const collabEventIds = (hostRows ?? []).map((r) => r.event_id);

  // Step 2: fetch events where creator OR co-host
  const orFilter =
    collabEventIds.length > 0
      ? `creator_profile_id.eq.${clubId},id.in.(${collabEventIds.join(",")})`
      : `creator_profile_id.eq.${clubId}`;

  const { data, error } = await supabaseAdmin
    .from("events")
    .select(EVENT_CARD_SELECT)
    .or(orFilter)
    .order("start", { ascending: false, nullsFirst: false });

  if (error) throw new Error(error.message);

  return Promise.all((data ?? []).map(toEventCardDetails));
}
