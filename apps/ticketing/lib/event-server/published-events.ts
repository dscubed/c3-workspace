import { supabaseAdmin } from "@c3/supabase";


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
