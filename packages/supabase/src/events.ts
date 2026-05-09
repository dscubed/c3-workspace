import { supabaseAdmin } from "./admin";
import type {
  EventCardDetails,
  EventCardDetailsWithStats,
  AvatarProfile,
} from "@c3/types";

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
function toEventCardDetails(
  row: any,
  hostProfiles: Map<string, AvatarProfile>,
): EventCardDetails {
  const profile = hostProfiles.get(row.creator_profile_id);

  return {
    id: row.id,
    name: row.name ?? null,
    start: row.start ?? null,
    status: row.status,
    category: row.category ?? null,
    is_online: row.is_online ?? false,
    location_name: row.location_text ?? null,
    thumbnail: row.thumbnail_url ?? null,
    host: profile
      ? {
          id: profile.id,
          first_name: profile.first_name,
          avatar_url: profile.avatar_url,
        }
      : { id: "", first_name: "Unknown", avatar_url: null },
    collaborators: null,
  };
}

/**
 * Fetch event cards for a club (admin-side, uses service role).
 * Includes events where the club is the creator OR an accepted co-host.
 * Returns all statuses so admins can see drafts too.
 * Each card includes aggregated registration and attendance counts.
 */
export async function fetchClubEventCards(
  clubId: string,
): Promise<EventCardDetails[]> {
  const { data: hostRows } = await supabaseAdmin
    .from("event_hosts")
    .select("event_id")
    .eq("profile_id", clubId)
    .eq("status", "accepted");

  const collabEventIds = (hostRows ?? []).map((r) => r.event_id);

  const orFilter =
    collabEventIds.length > 0
      ? `creator_profile_id.eq.${clubId},id.in.(${collabEventIds.join(",")})`
      : `creator_profile_id.eq.${clubId}`;

  const { data, error } = await supabaseAdmin
    .from("event_summary")
    .select("*")
    .or(orFilter)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = data ?? [];

  const creatorIds = [
    ...new Set(
      rows.map((r) => r.creator_profile_id as string).filter(Boolean),
    ),
  ];

  const hostProfiles = new Map<string, AvatarProfile>();
  if (creatorIds.length > 0) {
    const { data: profileRows } = await supabaseAdmin
      .from("profiles")
      .select("id, first_name, avatar_url")
      .in("id", creatorIds);

    for (const p of profileRows ?? []) {
      hostProfiles.set(p.id, {
        id: p.id,
        first_name: p.first_name,
        avatar_url: p.avatar_url,
      });
    }
  }

  const events = rows.map((row) => toEventCardDetails(row, hostProfiles));

  const eventsWithCollaborators = await Promise.all(
    events.map(async (event) => {
      const collaborators = await getEventCollaborators(event.id);
      return { ...event, collaborators };
    }),
  );

  return eventsWithCollaborators;
}

/**
 * Same as fetchClubEventCards but enriches each event with registration
 * and attendance counts from event_registrations in a single batch query.
 */
export async function fetchClubEventCardsWithStats(
  clubId: string,
): Promise<EventCardDetailsWithStats[]> {
  const events = await fetchClubEventCards(clubId);

  if (events.length === 0) {
    return [];
  }

  const eventIds = events.map((e) => e.id);

  const { data: regRows, error: regError } = await supabaseAdmin
    .from("event_registrations")
    .select("event_id, checked_in")
    .in("event_id", eventIds);

  if (regError) throw new Error(regError.message);

  const statsMap = new Map<string, { registered: number; attended: number }>();
  for (const row of regRows ?? []) {
    const existing = statsMap.get(row.event_id) ?? {
      registered: 0,
      attended: 0,
    };
    existing.registered += 1;
    if (row.checked_in) existing.attended += 1;
    statsMap.set(row.event_id, existing);
  }

  return events.map((event) => ({
    ...event,
    registered: statsMap.get(event.id)?.registered ?? 0,
    attended: statsMap.get(event.id)?.attended ?? 0,
  }));
}
