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
  OccurrenceFormData,
} from "@/components/events/shared/types";
import { DEFAULT_THEME } from "@/components/events/shared/types";
import type { SectionData, SectionType } from "@/components/events/sections/types";
import { splitUtcTimestampInTimeZone } from "@/lib/utils/timezone";
import { PublicEventData } from "./fetchEventServer";

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

  /* ── Venues ── */
  const sortedVenues = [...(event.venues ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const primaryVenue =
    sortedVenues.find((v) => v.type !== "tba") ?? sortedVenues[0];

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

  /* ── Occurrences (from event_occurrences table) ── */
  const occurrences: OccurrenceFormData[] = (event.occurrences ?? []).map((o) => {
    const s = splitUtcTimestampInTimeZone(o.start, tz);
    const e = o.end
      ? splitUtcTimestampInTimeZone(o.end, tz)
      : { date: s.date, time: "" };
    return {
      id: o.id,
      name: o.name ?? undefined,
      startDate: s.date,
      startTime: s.time,
      endDate: e.date,
      endTime: e.time,
      venueIds: (o.event_occurrence_venues ?? []).map((v) => v.venue_id),
    };
  });

  /* ── Theme ── */
  const theme: EventTheme = event.theme
    ? {
        mode: event.theme.mode as EventTheme["mode"],
        layout: event.theme.layout as EventTheme["layout"],
        accent: event.theme.accent as EventTheme["accent"],
        accentCustom: event.theme.accent_custom ?? undefined,
        bgColor: event.theme.bg_color ?? undefined,
      }
    : { ...DEFAULT_THEME };

  /* ── Pricing / ticket tiers ── */
  const pricing: TicketTier[] = event.ticket_tiers.map((t) => ({
    id: t.id,
    memberVerification: t.member_verification,
    name: t.name,
    price: t.price,
    stripePriceId: t.stripe_price_id,
    quantity: t.quantity,
    sold: t.sold,
    ...(t.offer_start
      ? (() => {
          const s = splitUtcTimestampInTimeZone(t.offer_start, tz);
          return { offerStartDate: s.date, offerStartTime: s.time };
        })()
      : {}),
    ...(t.offer_end
      ? (() => {
          const e = splitUtcTimestampInTimeZone(t.offer_end, tz);
          return { offerEndDate: e.date, offerEndTime: e.time };
        })()
      : {}),
  }));

  /* ── Links ── */
  const links: EventLink[] = event.links.map((l) => ({
    id: l.id,
    url: l.url,
    title: l.title ?? "",
  }));

  /* ── Images ── */
  const existingImages = event.images.map((i) => i.url);
  const carouselImages: CarouselImage[] = event.images.map((i) => ({
    id: i.id,
    url: i.url,
  }));

  /* ── Hosts ── */
  const hostsData: ClubProfile[] = event.hosts
    .filter((h) => (h.status === "accepted" || h.status === "pending") && h.profiles)
    .map((h) => ({
      id: h.profiles!.id,
      first_name: h.profiles!.first_name,
      avatar_url: h.profiles!.avatar_url,
    }));

  /* ── Sections ── */
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
    timezone: tz,
    venues,
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
  };
}
