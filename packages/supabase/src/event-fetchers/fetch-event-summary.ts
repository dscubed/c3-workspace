import { supabaseAdmin } from "../admin";

export interface EventSummaryRow {
  id: string | null;
  name: string | null;
  status: string | null;
  description: string | null;
  published_at: string | null;
  source: string | null;
  creator_profile_id: string | null;
  created_at: string | null;
  category: string | null;
  tags: string[] | null;
  is_online: boolean | null;
  timezone: string | null;
  url_slug: string | null;
  start: string | null;
  end: string | null;
  thumbnail_url: string | null;
  location_text: string | null;
  collaborator_ids: string[] | null;
}

export async function fetchEventSummaryById(
  eventId: string,
): Promise<EventSummaryRow | null> {
  const { data, error } = await supabaseAdmin
    .from("event_summary")
    .select("*")
    .eq("id", eventId)
    .single();

  if (error || !data) return null;
  return data as unknown as EventSummaryRow;
}

export async function fetchClubEventSummaries(
  clubId: string,
  opts?: { status?: string; ascending?: boolean; limit?: number },
): Promise<EventSummaryRow[]> {
  let query = supabaseAdmin
    .from("event_summary")
    .select("*")
    .eq("creator_profile_id", clubId);

  if (opts?.status) {
    query = query.eq("status", opts.status);
  }

  query = query.order("created_at", { ascending: opts?.ascending ?? false });

  if (opts?.limit) {
    query = query.limit(opts.limit);
  }

  const { data, error } = await query;

  if (error || !data) return [];
  return data as unknown as EventSummaryRow[];
}

export async function fetchAllEventSummaryPages(
  clubId: string,
  opts?: { status?: string; ascending?: boolean; pageSize?: number },
): Promise<EventSummaryRow[]> {
  const all: EventSummaryRow[] = [];
  const pageSize = opts?.pageSize ?? 500;
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabaseAdmin
      .from("event_summary")
      .select("*")
      .eq("creator_profile_id", clubId)
      .order("created_at", { ascending: opts?.ascending ?? false })
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (opts?.status) {
      query = query.eq("status", opts.status);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      hasMore = false;
      break;
    }

    all.push(...(data as unknown as EventSummaryRow[]));

    if (data.length < pageSize) {
      hasMore = false;
    } else {
      page++;
    }
  }

  return all;
}
