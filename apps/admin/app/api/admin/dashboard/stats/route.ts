import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@c3/supabase/server";
import { supabaseAdmin } from "@c3/supabase/admin";

interface WeekBucket {
  label: string;
  start: Date;
  end: Date;
}

function getWeekBuckets(now: Date): WeekBucket[] {
  const day = now.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  const lastMonday = new Date(now);
  lastMonday.setDate(now.getDate() - daysSinceMonday);
  lastMonday.setHours(0, 0, 0, 0);

  const buckets: WeekBucket[] = [];
  for (let i = 6; i >= 0; i--) {
    const start = new Date(lastMonday);
    start.setDate(start.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const label =
      i === 0
        ? "This wk"
        : i === 1
          ? "Last wk"
          : `${i + 1}w ago`;
    buckets.push({ label, start, end });
  }
  return buckets;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clubId = request.nextUrl.searchParams.get("club_id");
    if (!clubId) {
      return NextResponse.json({ error: "club_id is required" }, { status: 400 });
    }

    const buckets = getWeekBuckets(new Date());

    const { data: events, error: eventsErr } = await supabaseAdmin
      .from("event_summary")
      .select("*")
      .eq("creator_profile_id", clubId)
      .eq("status", "published")
      .order("created_at", { ascending: true });

    if (eventsErr) {
      console.error("[dashboard stats] events error:", eventsErr);
      return NextResponse.json({ error: "Failed to query events" }, { status: 500 });
    }

    const now = new Date();
    const eventIds = (events ?? []).map((e) => e.id!);

    const { data: regRows } = eventIds.length > 0
      ? await supabaseAdmin
          .from("event_registrations")
          .select("event_id")
          .in("event_id", eventIds)
      : { data: [] };

    const regCountMap = new Map<string, number>();
    for (const r of regRows ?? []) {
      regCountMap.set(r.event_id, (regCountMap.get(r.event_id) ?? 0) + 1);
    }

    const upcomingEvents = (events ?? [])
      .filter((e) => {
        if (!e.start) return false;
        const endDate = e.end ? new Date(e.end) : new Date(e.start);
        endDate.setHours(23, 59, 59, 999);
        return endDate >= now;
      })
      .slice(0, 3)
      .map((e) => ({
        id: e.id,
        name: e.name,
        start: e.start,
        status: e.start && new Date(e.start) <= now ? "live" : "upcoming",
        thumbnail: e.thumbnail_url ?? null,
        location: e.location_text ?? null,
        registered: regCountMap.get(e.id!) ?? 0,
      }));

    const weekly: {
      members: number[];
      eventRegistrations: number[];
      eventAttendees: number[];
    } = {
      members: [],
      eventRegistrations: [],
      eventAttendees: [],
    };

    for (const bucket of buckets) {
      if (eventIds.length === 0) {
        weekly.members.push(0);
        weekly.eventRegistrations.push(0);
        weekly.eventAttendees.push(0);
        continue;
      }

      const endIso = bucket.end.toISOString();

      const [{ count: memberCount }, { count: regCount }, { count: attendeeCount }] = await Promise.all([
        supabaseAdmin
          .from("club_memberships")
          .select("*", { count: "exact", head: true })
          .eq("club_id", clubId)
          .lt("created_at", endIso),
        supabaseAdmin
          .from("event_registrations")
          .select("*", { count: "exact", head: true })
          .in("event_id", eventIds)
          .lt("created_at", endIso),
        supabaseAdmin
          .from("event_registrations")
          .select("*", { count: "exact", head: true })
          .in("event_id", eventIds)
          .eq("checked_in", true)
          .lt("created_at", endIso),
      ]);

      weekly.members.push(memberCount ?? 0);
      weekly.eventRegistrations.push(regCount ?? 0);
      weekly.eventAttendees.push(attendeeCount ?? 0);
    }

    return NextResponse.json({
      data: {
        upcomingEvents,
        weekly,
      },
    });
  } catch (error) {
    console.error("[dashboard stats] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
