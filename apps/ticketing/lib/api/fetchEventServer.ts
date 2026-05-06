import { supabaseAdmin } from "@c3/supabase/admin";
import { getClubAdminRow } from "@/lib/auth/clubAdmin";
import type { FetchedEventData } from "@/lib/api/fetchEvent";
import type {
  EventFormData,
  EventTheme,
  EventLink,
  TicketTier,
  LocationData,
  LocationType,
  Venue,
  CarouselImage,
  ClubProfile,
} from "@/components/events/shared/types";
import { DEFAULT_THEME } from "@/components/events/shared/types";
import type {
  SectionData,
  SectionType,
} from "@/components/events/sections/types";
import { splitUtcTimestampInTimeZone } from "@/lib/utils/timezone";

/**
 * Minimal event data for the public event page (server-side only).
 * Fetches directly from Supabase — no API round-trip.
 */
export interface PublicEventData {
  id: string;
  name: string | null;
  description: string | null;
  start: string | null;
  end: string | null;
  timezone: string | null;
  is_online: boolean;
  category: string | null;
  tags: string[] | null;
  status: string;
  thumbnail: string | null;
  event_capacity: number | null;
  creator_profile_id: string;
  venues: {
    id: string;
    type: string;
    venue: string | null;
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    online_link: string | null;
    sort_order: number;
  }[];
  images: { id: string; url: string; sort_order: number }[];
  hosts: {
    profile_id: string;
    status: string;
    profiles: {
      id: string;
      first_name: string;
      avatar_url: string | null;
    } | null;
  }[];
  ticket_tiers: {
    id: string;
    member_verification: boolean;
    name: string;
    price: number;
    quantity: number | null;
    sort_order: number;
  }[];
  links: {
    id: string;
    url: string;
    title: string | null;
    sort_order: number;
  }[];
  theme: {
    mode: string;
    layout: string;
    accent: string;
    accent_custom: string | null;
    bg_color: string | null;
  } | null;
  sections: { id: string; type: string; data: unknown; sort_order: number }[];
  creator_profile: {
    id: string;
    first_name: string;
    avatar_url: string | null;
  } | null;
  url_slug: string | null;
  club_name: string | null;
}

/**
 * Fetch a single event by ID (server-side).
 * By default only returns published events (safe for public pages).
 * Pass `requirePublished: false` to fetch any status (for owner/edit checks).
 */
export async function fetchEventServer(
  eventId: string,
  { requirePublished = true }: { requirePublished?: boolean } = {},
): Promise<PublicEventData | null> {
  let query = supabaseAdmin
    .from("events")
    .select("*, event_venues(*)")
    .eq("id", eventId);

  if (requirePublished) {
    query = query.eq("status", "published");
  }

  const { data: event, error } = await query.single();

  if (error || !event) return null;

  const [images, hosts, tiers, links, sections, creatorProfile] =
    await Promise.all([
      supabaseAdmin
        .from("event_images")
        .select("id, url, sort_order")
        .eq("event_id", event.id)
        .order("sort_order"),
      supabaseAdmin
        .from("event_hosts")
        .select(
          "profile_id, status, profiles:profile_id(id, first_name, avatar_url)",
        )
        .eq("event_id", event.id)
        .order("sort_order"),
      supabaseAdmin
        .from("event_ticket_tiers")
        .select("id, member_verification, name, price, quantity, sort_order")
        .eq("event_id", event.id)
        .order("sort_order"),
      supabaseAdmin
        .from("event_links")
        .select("id, url, title, sort_order")
        .eq("event_id", event.id)
        .order("sort_order"),
      supabaseAdmin
        .from("event_sections")
        .select("id, type, data, sort_order")
        .eq("event_id", event.id)
        .order("sort_order"),
      supabaseAdmin
        .from("profiles")
        .select("id, first_name, avatar_url")
        .eq("id", event.creator_profile_id)
        .single(),
    ]);

  /* Theme comes directly from the events row */
  const theme =
    event.theme_mode != null
      ? {
          mode: event.theme_mode,
          layout: event.theme_layout,
          accent: event.theme_accent,
          accent_custom: event.theme_accent_custom ?? null,
          bg_color: event.theme_bg_color ?? null,
        }
      : null;

  return {
    id: event.id,
    name: event.name,
    description: event.description,
    start: event.start,
    end: event.end,
    timezone: event.timezone,
    is_online: event.is_online,
    category: event.category,
    tags: event.tags,
    status: event.status,
    thumbnail: (images.data ?? [])[0]?.url ?? null,
    event_capacity: event.event_capacity,
    creator_profile_id: event.creator_profile_id,
    venues: (event.event_venues ?? []) as PublicEventData["venues"],
    images: images.data ?? [],
    hosts: (hosts.data ?? []) as unknown as PublicEventData["hosts"],
    ticket_tiers: tiers.data ?? [],
    links: links.data ?? [],
    theme,
    sections: sections.data ?? [],
    creator_profile: creatorProfile.data ?? null,
    url_slug: event.url_slug ?? null,
    club_name: creatorProfile.data?.first_name ?? null,
  };
}

/**
 * Return URL segments for all published events — used by generateStaticParams
 * and the sitemap. Includes both slug and ID so both paths are pre-rendered:
 * the ID path will redirect to the slug at runtime.
 */
export async function getAllPublishedEventIds(): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from("events")
    .select("id, url_slug")
    .eq("status", "published");

  const segments: string[] = [];
  for (const e of data ?? []) {
    segments.push(e.id);
    if (e.url_slug) segments.push(e.url_slug);
  }
  return [...new Set(segments)];
}

/**
 * Resolve an event by ID or url_slug.
 * Tries by ID first; if not found, falls back to url_slug lookup.
 * Use this anywhere a route param could be either an ID or a slug.
 */
export async function resolveEventByIdOrSlug(
  param: string,
  options: { requirePublished?: boolean } = {},
): Promise<PublicEventData | null> {
  const byId = await fetchEventServer(param, options);
  if (byId) return byId;

  const slugQuery = supabaseAdmin
    .from("events")
    .select("id")
    .eq("url_slug", param);

  if (options.requirePublished !== false) {
    slugQuery.eq("status", "published");
  }

  const { data } = await slugQuery.maybeSingle();
  if (!data) return null;

  return fetchEventServer(data.id, options);
}

/**
 * Return canonical URL segments for published events.
 * Prefers slug when available — used for the sitemap.
 */
export async function getAllPublishedEventCanonicals(): Promise<
  { segment: string; updatedAt?: string }[]
> {
  const { data } = await supabaseAdmin
    .from("events")
    .select("id, url_slug, updated_at")
    .eq("status", "published");

  return (data ?? []).map((e) => ({
    segment: e.url_slug ?? e.id,
    updatedAt: e.updated_at ?? undefined,
  }));
}

/**
 * Check whether a user has edit access to an event.
 * Returns { allowed: true } if the user is the creator or an accepted host.
 * Returns { allowed: false, reason } otherwise.
 */
export async function checkEventEditAccess(
  eventId: string,
  userId: string | null,
): Promise<
  | { allowed: true; event: PublicEventData }
  | { allowed: false; reason: "not_authenticated" | "not_found" | "forbidden" }
> {
  if (!userId) {
    console.log("[checkEventEditAccess] No userId — not authenticated");
    return { allowed: false, reason: "not_authenticated" };
  }

  console.log("[checkEventEditAccess] eventId:", eventId, "userId:", userId);

  const event = await fetchEventServer(eventId, { requirePublished: false });

  if (!event) {
    console.log("[checkEventEditAccess] Event not found");
    return { allowed: false, reason: "not_found" };
  }

  console.log(
    "[checkEventEditAccess] event.creator_profile_id:",
    event.creator_profile_id,
  );

  // Creator always has access
  if (event.creator_profile_id === userId) {
    console.log("[checkEventEditAccess] User is creator → allowed");
    return { allowed: true, event };
  }

  // Accepted collaborators have access
  const isHost = event.hosts.some(
    (h) => h.profile_id === userId && h.status === "accepted",
  );

  if (isHost) {
    console.log("[checkEventEditAccess] User is accepted host → allowed");
    return { allowed: true, event };
  }

  // Club admins have access — check both the creator org AND any collaborator orgs
  // 1) Check if the event creator is a club the user admins
  if (event.creator_profile_id) {
    console.log(
      "[checkEventEditAccess] Checking club admin for creator — clubId:",
      event.creator_profile_id,
      "userId:",
      userId,
    );
    const adminRow = await getClubAdminRow(event.creator_profile_id, userId);
    console.log(
      "[checkEventEditAccess] creator adminRow:",
      JSON.stringify(adminRow),
    );
    if (adminRow) {
      console.log(
        "[checkEventEditAccess] User is club admin of creator → allowed",
      );
      return { allowed: true, event };
    }
  }

  // 2) Check if any accepted collaborator is a club the user admins
  const collaboratorIds = event.hosts
    .filter((h) => h.status === "accepted")
    .map((h) => h.profile_id);
  if (collaboratorIds.length > 0) {
    console.log(
      "[checkEventEditAccess] Checking club admin for collaborators:",
      collaboratorIds,
    );
    for (const collabId of collaboratorIds) {
      const adminRow = await getClubAdminRow(collabId, userId);
      if (adminRow) {
        console.log(
          "[checkEventEditAccess] User is admin of collaborator club",
          collabId,
          "→ allowed",
        );
        return { allowed: true, event };
      }
    }
  }

  console.log("[checkEventEditAccess] No match → forbidden");
  return { allowed: false, reason: "forbidden" };
}

/* ── Section type mapping (DB uses underscores, SectionData uses dashes) ── */
const DB_SECTION_TYPE_MAP: Record<string, SectionType> = {
  faq: "faq",
  what_to_bring: "what-to-bring",
  "what-to-bring": "what-to-bring",
  panelists: "panelists",
  companies: "companies",
  refund_policy: "refund-policy",
  "refund-policy": "refund-policy",
};

/**
 * Convert PublicEventData (server-fetched) into FetchedEventData
 * so it can be passed directly to EventForm.
 */
export function publicToFetchedData(event: PublicEventData): FetchedEventData {
  const tz = event.timezone ?? "Australia/Sydney";

  const startParts = event.start
    ? splitUtcTimestampInTimeZone(event.start, tz)
    : null;
  const endParts = event.end
    ? splitUtcTimestampInTimeZone(event.end, tz)
    : null;

  const sortedVenues = [...(event.venues ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const primaryVenue =
    sortedVenues.find((v) => v.type !== "tba") ?? sortedVenues[0];

  const locationType: LocationType = event.is_online
    ? "online"
    : primaryVenue && primaryVenue.type !== "tba"
      ? (primaryVenue.type as LocationType)
      : "tba";

  const location: LocationData = {
    displayName: primaryVenue?.venue ?? "",
    address: primaryVenue?.address ?? "",
    lat: primaryVenue?.latitude ?? undefined,
    lon: primaryVenue?.longitude ?? undefined,
  };

  const venues: Venue[] =
    sortedVenues.length > 0
      ? sortedVenues.map((v) => ({
          id: v.id,
          type: v.type as LocationType,
          location: {
            displayName: v.venue ?? "",
            address: v.address ?? "",
            lat: v.latitude ?? undefined,
            lon: v.longitude ?? undefined,
          },
          onlineLink: v.online_link ?? undefined,
        }))
      : [];

  const occurrences = startParts
    ? [
        {
          id: `pub-${event.id}`,
          startDate: startParts.date,
          startTime: startParts.time,
          endDate: endParts?.date ?? startParts.date,
          endTime: endParts?.time ?? "",
        },
      ]
    : [];

  const theme: EventTheme = event.theme
    ? {
        mode: event.theme.mode as EventTheme["mode"],
        layout: event.theme.layout as EventTheme["layout"],
        accent: event.theme.accent as EventTheme["accent"],
        accentCustom: event.theme.accent_custom ?? undefined,
        bgColor: event.theme.bg_color ?? undefined,
      }
    : { ...DEFAULT_THEME };

  const pricing: TicketTier[] = event.ticket_tiers.map((t) => ({
    id: t.id,
    memberVerification: t.member_verification,
    name: t.name,
    price: t.price,
    stripePriceId: (t as { stripe_price_id?: string | null }).stripe_price_id ?? null,
    quantity: t.quantity,
  }));

  const links: EventLink[] = event.links.map((l) => ({
    id: l.id,
    url: l.url,
    title: l.title ?? "",
  }));

  const existingImages = event.images.map((i) => i.url);
  const carouselImages: CarouselImage[] = event.images.map((i) => ({
    id: i.id,
    url: i.url,
  }));

  const hostsData: ClubProfile[] = event.hosts
    .filter(
      (h) => (h.status === "accepted" || h.status === "pending") && h.profiles,
    )
    .map((h) => ({
      id: h.profiles!.id,
      first_name: h.profiles!.first_name,
      avatar_url: h.profiles!.avatar_url,
    }));

  const sections: SectionData[] = event.sections
    .map((s) => {
      const type = DB_SECTION_TYPE_MAP[s.type];
      if (!type) return null;
      return { type, ...(s.data as object) } as SectionData;
    })
    .filter((s): s is SectionData => s !== null);

  const creatorProfile: ClubProfile | undefined = event.creator_profile
    ? {
        id: event.creator_profile.id,
        first_name: event.creator_profile.first_name,
        avatar_url: event.creator_profile.avatar_url,
      }
    : undefined;

  const formData: Partial<EventFormData> = {
    name: event.name ?? "",
    description: event.description ?? "",
    startDate: startParts?.date ?? "",
    startTime: startParts?.time ?? "",
    endDate: endParts?.date ?? "",
    endTime: endParts?.time ?? "",
    timezone: tz,
    location,
    isOnline: event.is_online,
    locationType,
    onlineLink: "",
    venues,
    isRecurring: false,
    occurrences,
    category: event.category ?? "",
    tags: event.tags ?? [],
    hostIds: hostsData.map((h) => h.id),
    imageUrls: existingImages,
    pricing,
    eventCapacity: event.event_capacity,
    links,
    theme,
  };

  return {
    formData,
    existingImages,
    carouselImages,
    hostsData,
    sections,
    creatorProfileId: event.creator_profile_id,
    creatorProfile,
    urlSlug: null,
    status: event.status as "draft" | "published" | "archived",
    clubName: event.club_name ?? creatorProfile?.first_name ?? null,
    startUtc: event.start ?? null,
    endUtc: event.end ?? null,
  };
}
