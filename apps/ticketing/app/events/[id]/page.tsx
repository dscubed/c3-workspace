import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  fetchEventServer,
  getAllPublishedEventIds,
  publicToFetchedData,
  resolveEventByIdOrSlug,
} from "@/lib/api/fetchEventServer";
import { TicketingButton } from "@/components/events/TicketingButton";
import EventForm from "@/components/event-form/EventForm";
import type { ThemeAccent } from "@/components/events/shared/types";

/* ── Static generation ─────────────────────────────────────────── */

/**
 * Pre-render all published events at build time (both ID and slug paths).
 * New events are generated on-demand via ISR (dynamicParams defaults to true).
 */
export async function generateStaticParams() {
  const ids = await getAllPublishedEventIds();
  return ids.map((id) => ({ id }));
}

/** Revalidate every 60 seconds — keeps pages fresh without a full rebuild. */
export const revalidate = 60;

/* ── Site URL ──────────────────────────────────────────────────── */

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

/* ── Dynamic metadata for SEO / Open Graph ─────────────────────── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await resolveEventByIdOrSlug(id);

  if (!event) {
    return { title: "Event Not Found | Connect3" };
  }

  const canonical = `${SITE_URL}/events/${event.url_slug ?? event.id}`;
  const title = event.name ? `${event.name} | Connect3` : "Event | Connect3";
  const description =
    event.description?.slice(0, 160) ||
    "Check out this event on Connect3 — the all-in-one ticketing solution for clubs.";
  const ogImage = event.images[0]?.url ?? `${SITE_URL}/og-default.png`;

  const startDate = event.start
    ? new Date(event.start).toISOString()
    : undefined;
  const endDate = event.end ? new Date(event.end).toISOString() : undefined;

  return {
    title,
    description,
    keywords: [
      ...(event.tags ?? []),
      ...(event.category ? [event.category] : []),
      "event",
      "ticketing",
      "Connect3",
    ],
    authors: event.creator_profile
      ? [{ name: event.creator_profile.first_name }]
      : undefined,
    openGraph: {
      title: event.name ?? "Event",
      description,
      url: canonical,
      siteName: "Connect3 Ticketing",
      images: [
        { url: ogImage, width: 1200, height: 630, alt: event.name ?? "Event" },
      ],
      type: "website",
    },
    twitter: {
      card: event.images[0]?.url ? "summary_large_image" : "summary",
      title: event.name ?? "Event",
      description,
      images: event.images[0]?.url ? [event.images[0].url] : [],
    },
    alternates: {
      canonical,
    },
    other: {
      ...(startDate ? { "event:start_time": startDate } : {}),
      ...(endDate ? { "event:end_time": endDate } : {}),
      ...(event.venues?.[0]?.venue
        ? { "event:location": event.venues[0].venue }
        : {}),
    },
  };
}

/* ── Structured data (JSON-LD) ─────────────────────────────────── */

function EventJsonLd({
  event,
  canonicalUrl,
}: {
  event: Awaited<ReturnType<typeof fetchEventServer>>;
  canonicalUrl: string;
}) {
  if (!event) return null;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Events",
        item: `${SITE_URL}/events`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: event.name ?? "Event",
        item: canonicalUrl,
      },
    ],
  };

  const eventLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.name ?? "Untitled Event",
    description: event.description ?? undefined,
    url: canonicalUrl,
    startDate: event.start ?? undefined,
    endDate: event.end ?? undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: event.is_online
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    ...(() => {
      const v = event.venues?.find((x) => x.type !== "tba");
      if (v && !event.is_online) {
        return {
          location: {
            "@type": "Place",
            name: v.venue ?? undefined,
            address: v.address ?? undefined,
            ...(v.latitude && v.longitude
              ? {
                  geo: {
                    "@type": "GeoCoordinates",
                    latitude: v.latitude,
                    longitude: v.longitude,
                  },
                }
              : {}),
          },
        };
      }
      if (event.is_online) {
        return {
          location: { "@type": "VirtualLocation", url: canonicalUrl },
        };
      }
      return {};
    })(),
    ...(event.images[0]?.url ? { image: event.images[0].url } : {}),
    organizer: event.creator_profile
      ? {
          "@type": "Organization",
          name: event.creator_profile.first_name,
        }
      : undefined,
    ...(event.ticket_tiers.length > 0
      ? {
          offers: event.ticket_tiers.map((t) => ({
            "@type": "Offer",
            name: t.name,
            price: t.price,
            priceCurrency: "AUD",
            availability: "https://schema.org/InStock",
            url: canonicalUrl,
          })),
        }
      : {
          offers: {
            "@type": "Offer",
            price: 0,
            priceCurrency: "AUD",
            availability: "https://schema.org/InStock",
            url: canonicalUrl,
          },
        }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(eventLd) }}
      />
    </>
  );
}

/* ── Page component ────────────────────────────────────────────── */

export default async function EventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await resolveEventByIdOrSlug(id);

  if (!event) notFound();

  /* ID → slug redirect (only when slug exists and URL isn't already the slug) */
  if (event.url_slug && id !== event.url_slug) {
    redirect(`/events/${event.url_slug}`);
  }

  const canonicalUrl = `${SITE_URL}/events/${event.url_slug ?? event.id}`;

  return (
    <>
      <EventJsonLd event={event} canonicalUrl={canonicalUrl} />
      <EventForm
        mode="preview"
        eventId={event.id}
        data={publicToFetchedData(event)}
      />
      {/* Sticky ticketing button (visitor mode — only shows if ticketing is enabled) */}
      <TicketingButton
        eventId={event.id}
        mode="preview"
        accent={(event.theme?.accent as ThemeAccent) ?? "none"}
        accentCustom={event.theme?.accent_custom ?? undefined}
        isDark={event.theme?.mode === "dark"}
      />
    </>
  );
}
