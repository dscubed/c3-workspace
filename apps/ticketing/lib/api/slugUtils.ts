import { supabaseAdmin } from "@c3/supabase/admin";

/**
 * Convert any string into a URL-safe kebab-case slug.
 * - Lowercases everything
 * - Strips accent marks (e.g. é → e)
 * - Removes characters that aren't alphanumeric, spaces, or hyphens
 * - Collapses whitespace / repeated hyphens into a single hyphen
 * - Trims leading/trailing hyphens
 * - Caps at 80 characters
 */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")                     // decompose accented chars
    .replace(/[\u0300-\u036f]/g, "")       // strip combining accent marks
    .replace(/[^a-z0-9\s-]/g, "")         // drop anything else
    .trim()
    .replace(/\s+/g, "-")                  // spaces → hyphens
    .replace(/-+/g, "-")                   // collapse repeated hyphens
    .replace(/^-+|-+$/g, "")              // trim edge hyphens
    .slice(0, 80);
}

/**
 * Generate a slug that is unique across the events table.
 * - Tries `base`, then `base-2`, `base-3`, … up to `base-99`
 * - Falls back to `base-<timestamp>` if all suffixes are taken
 * - `excludeEventId` lets the owning event's own slug count as "available"
 * - Returns null if the name produces an empty slug
 */
export async function generateUniqueSlug(
  name: string,
  excludeEventId: string,
): Promise<string | null> {
  const base = toSlug(name);
  if (!base) return null;

  const isAvailable = async (candidate: string): Promise<boolean> => {
    const { data } = await supabaseAdmin
      .from("event_summary")
      .select("id")
      .eq("url_slug", candidate)
      .maybeSingle();
    return !data || data.id === excludeEventId;
  };

  if (await isAvailable(base)) return base;

  for (let i = 2; i <= 99; i++) {
    const candidate = `${base}-${i}`;
    if (await isAvailable(candidate)) return candidate;
  }

  // Last resort — virtually guaranteed unique
  return `${base}-${Date.now()}`;
}
