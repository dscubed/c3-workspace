import type { MetadataRoute } from "next";
import { getAllPublishedEventCanonicals } from "@/lib/event-server/published-events";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

/**
 * Dynamic sitemap — automatically includes all published events.
 * Uses slug-preferred canonical URLs. Google Search Console will
 * pick this up at /sitemap.xml.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const events = await getAllPublishedEventCanonicals();

  const eventEntries: MetadataRoute.Sitemap = events.map(({ segment, updatedAt }) => ({
    url: `${SITE_URL}/events/${segment}`,
    lastModified: updatedAt ? new Date(updatedAt) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...eventEntries,
  ];
}
