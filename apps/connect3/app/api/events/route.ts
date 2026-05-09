import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { type Event } from "@/lib/schemas/events/event";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
);

function isPaidEvent(tiers: { price: number }[] | undefined): boolean {
  return (tiers ?? []).some((t) => t.price > 0);
}

function buildPricing(tiers: { price: number }[] | undefined) {
  const prices = (tiers ?? []).map((t) => t.price);
  const min = prices.length > 0 ? Math.min(...prices) : 0;
  const max = prices.length > 0 ? Math.max(...prices) : 0;
  return { min, max };
}

function transformDbEvent(
  row: any,
  tiersData: { price: number }[] | undefined,
): Event {
  return {
    id: row.id,
    name: row.name,
    creatorProfileId: row.creator_profile_id,
    description: row.description ?? undefined,
    start: row.start,
    end: row.end ?? undefined,
    publishedAt: row.published_at ?? row.created_at ?? new Date().toISOString(),
    isOnline: row.is_online,
    thumbnail: row.thumbnail_url ?? undefined,
    category: row.category ?? undefined,
    location: {
      venue: row.location_text ?? "TBA",
      address: "",
      latitude: 0,
      longitude: 0,
    },
    pricing: buildPricing(tiersData),
    source: row.source ?? undefined,
  };
}

async function fetchTiers(eventIds: string[]) {
  if (eventIds.length === 0) return new Map<string, { price: number }[]>();
  const { data } = await supabase
    .from("event_ticket_tiers")
    .select("event_id, price")
    .in("event_id", eventIds);
  const map = new Map<string, { price: number }[]>();
  for (const t of (data ?? [])) {
    if (!map.has(t.event_id)) map.set(t.event_id, []);
    map.get(t.event_id)!.push({ price: t.price });
  }
  return map;
}

function applyFilters(
  query: any,
  params: {
    search: string | null;
    category: string | null;
    dateFilter: string | null;
    tagFilter: string | null;
    clubs: string | null;
  },
) {
  query = query.eq("status", "published");

  if (params.search?.trim()) {
    query = query.ilike("name", `%${params.search.trim()}%`);
  }

  if (params.category) {
    query = query.eq("category", params.category);
  }

  if (params.clubs) {
    const clubIds = params.clubs.split(",").filter(Boolean);
    if (clubIds.length > 0) {
      query = query.in("creator_profile_id", clubIds);
    }
  }

  if (params.tagFilter === "online") {
    query = query.eq("is_online", true);
  } else if (params.tagFilter === "in-person") {
    query = query.eq("is_online", false);
  }

  return query;
}

const SUMMARY_SELECT = `
  id, name, description, published_at, source, creator_profile_id,
  created_at, category, is_online, start, end, thumbnail_url, location_text
`;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cursor = searchParams.get("cursor");
  const page = searchParams.get("page");
  const limit = parseInt(searchParams.get("limit") || "18");
  const search = searchParams.get("search");
  const category = searchParams.get("category");
  const dateFilter = searchParams.get("dateFilter");
  const tagFilter = searchParams.get("tagFilter");
  const clubs = searchParams.get("clubs");

  const filterParams = { search, category, dateFilter, tagFilter, clubs };
  const needsPostFilter = tagFilter === "free" || tagFilter === "paid";
  const sortAscending = dateFilter !== "past";

  try {
    if (page !== null) {
      const pageNum = Math.max(1, parseInt(page));
      const from = (pageNum - 1) * limit;

      if (needsPostFilter) {
        let allQuery = supabase
          .from("event_summary")
          .select(SUMMARY_SELECT)
          .order("created_at", { ascending: sortAscending });

        allQuery = applyFilters(allQuery, filterParams);
        const { data, error } = await allQuery;

        if (error) return NextResponse.json({ error: error.message }, { status: 500 });

        const rows: any[] = data ?? [];
        const eventIds = rows.map((r) => r.id);
        const tiersMap = await fetchTiers(eventIds);

        let filtered = rows;
        if (tagFilter === "free") {
          filtered = rows.filter((e) => !isPaidEvent(tiersMap.get(e.id)));
        } else if (tagFilter === "paid") {
          filtered = rows.filter((e) => isPaidEvent(tiersMap.get(e.id)));
        }

        const totalCount = filtered.length;
        const pageItems = filtered.slice(from, from + limit);
        return NextResponse.json({
          items: pageItems.map((r) => transformDbEvent(r, tiersMap.get(r.id))),
          totalCount,
          page: pageNum,
          totalPages: Math.ceil(totalCount / limit),
        });
      }

      let query = supabase
        .from("event_summary")
        .select(SUMMARY_SELECT, { count: "exact" })
        .order("created_at", { ascending: sortAscending })
        .range(from, from + limit - 1);

      query = applyFilters(query, filterParams);
      const { data, error, count } = await query;

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      const rows: any[] = data ?? [];
      const eventIds = rows.map((r) => r.id);
      const tiersMap = await fetchTiers(eventIds);

      return NextResponse.json({
        items: rows.map((r) => transformDbEvent(r, tiersMap.get(r.id))),
        totalCount: count ?? 0,
        page: pageNum,
        totalPages: Math.ceil((count ?? 0) / limit),
      });
    }

    let query = supabase
      .from("event_summary")
      .select(SUMMARY_SELECT)
      .order("created_at", { ascending: sortAscending });

    query = applyFilters(query, filterParams);

    if (cursor) {
      query = sortAscending
        ? query.gt("created_at", cursor)
        : query.lt("created_at", cursor);
    }

    const fetchSize = needsPostFilter ? limit * 3 : limit;
    query = query.limit(fetchSize + 1);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const dbHasMore = (data?.length ?? 0) > fetchSize;
    const batch: any[] = (data ?? []).slice(0, fetchSize);

    const eventIds = batch.map((r) => r.id);
    const tiersMap = await fetchTiers(eventIds);

    let filtered: any[] = batch;
    if (tagFilter === "free") {
      filtered = batch.filter((e) => !isPaidEvent(tiersMap.get(e.id)));
    } else if (tagFilter === "paid") {
      filtered = batch.filter((e) => isPaidEvent(tiersMap.get(e.id)));
    }

    const morePagesExist = needsPostFilter
      ? filtered.length > limit || dbHasMore
      : (data?.length ?? 0) > limit;

    const events = filtered.slice(0, limit);

    let newCursor: string | null = null;
    if (morePagesExist && data?.length) {
      const cursorRow = needsPostFilter
        ? (filtered.length > limit ? filtered[limit - 1] : batch[batch.length - 1])
        : data[limit - 1];
      newCursor = cursorRow.created_at;
    }

    return NextResponse.json({
      items: events.map((r) => transformDbEvent(r, tiersMap.get(r.id))),
      cursor: newCursor,
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
