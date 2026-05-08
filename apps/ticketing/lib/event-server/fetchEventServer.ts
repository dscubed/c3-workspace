import { supabaseAdmin } from "@c3/supabase";
import {
  fetchEventHosts,
  fetchEventImages,
  fetchEventTiers,
  fetchEventLinks,
  fetchEventSections,
  fetchEventOccurrences,
  fetchEventVenues,
  type HostRow,
  type ImageRow,
  type TierRow,
  type LinkRow,
  type SectionRow,
  type OccurrenceRow,
  type VenueRow,
} from "./fetch-helpers";
import { fetchEventRow } from "./fetch-helpers/fetch-event-row";

/* ── Public raw-shape types (matches DB column names) ── */

export interface PublicEventData {
  id: string;
  name: string | null;
  description: string | null;
  timezone: string | null;
  is_online: boolean;
  category: string | null;
  tags: string[] | null;
  status: string;
  thumbnail: string | null;
  event_capacity: number | null;
  creator_profile_id: string;
  venues: VenueRow[];
  images: ImageRow[];
  hosts: HostRow[];
  ticket_tiers: TierRow[];
  links: LinkRow[];
  theme: {
    mode: string;
    layout: string;
    accent: string;
    accent_custom: string | null;
    bg_color: string | null;
  } | null;
  sections: SectionRow[];
  occurrences: OccurrenceRow[];
  creator_profile: {
    id: string;
    first_name: string;
    avatar_url: string | null;
  } | null;
  url_slug: string | null;
  club_name: string | null;
}

function buildTheme(themeMode: unknown, themeLayout: unknown, themeAccent: unknown, themeAccentCustom: unknown, themeBgColor: unknown) {
  if (themeMode == null) return null;
  return {
    mode: String(themeMode),
    layout: String(themeLayout),
    accent: String(themeAccent),
    accent_custom: (themeAccentCustom as string) ?? null,
    bg_color: (themeBgColor as string) ?? null,
  };
}

/**
 * Fetch a single event with all related data (server-side).
 */
export async function fetchEventServer(
  eventId: string,
  { requirePublished = true }: { requirePublished?: boolean } = {},
): Promise<PublicEventData | null> {
  const row = await fetchEventRow(eventId);
  if (!row) return null;
  if (requirePublished && row.status !== "published") return null;

  const [
    images,
    hosts,
    tiers,
    links,
    sections,
    occurrences,
    venues,
    creatorProfile,
  ] = await Promise.all([
    fetchEventImages(eventId),
    fetchEventHosts(eventId),
    fetchEventTiers(eventId),
    fetchEventLinks(eventId),
    fetchEventSections(eventId),
    fetchEventOccurrences(eventId),
    fetchEventVenues(eventId),
    supabaseAdmin
      .from("profiles")
      .select("id, first_name, avatar_url")
      .eq("id", row.creator_profile_id)
      .single()
      .then(({ data }) => data),
  ]);

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    timezone: row.timezone,
    is_online: row.is_online,
    category: row.category,
    tags: row.tags,
    status: row.status,
    thumbnail: images[0]?.url ?? null,
    event_capacity: row.event_capacity,
    creator_profile_id: row.creator_profile_id,
    venues,
    images,
    hosts,
    ticket_tiers: tiers,
    links,
    theme: buildTheme(row.theme_mode, row.theme_layout, row.theme_accent, row.theme_accent_custom, row.theme_bg_color),
    sections,
    occurrences,
    creator_profile: creatorProfile ?? null,
    url_slug: row.url_slug,
    club_name: (creatorProfile as { first_name?: string } | null)?.first_name ?? null,
  };
}
