import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@c3/supabase/server";
import { supabaseAdmin } from "@c3/supabase/admin";

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

    const { data: events, error: eventsErr } = await supabaseAdmin
      .from("event_summary")
      .select("*")
      .eq("creator_profile_id", clubId)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (eventsErr) {
      return NextResponse.json({ error: "Failed to query events" }, { status: 500 });
    }

    if (!events || events.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const eventIds = events.map((e) => e.id!);

    const { data: tieredEvents } = await supabaseAdmin
      .from("event_ticket_tiers")
      .select("event_id")
      .in("event_id", eventIds)
      .gt("price", 0);

    const tieredEventIds = new Set((tieredEvents ?? []).map((t) => t.event_id));

    const { data: regs } = await supabaseAdmin
      .from("event_registrations")
      .select("event_id, amount_total, payout_settled")
      .in("event_id", eventIds)
      .eq("type", "ticket");

    const statsMap = new Map<string, { gross: number; unsettled: number; sold: number }>();
    for (const r of regs ?? []) {
      const existing = statsMap.get(r.event_id) ?? { gross: 0, unsettled: 0, sold: 0 };
      existing.gross += r.amount_total ?? 0;
      existing.sold++;
      if (!r.payout_settled) {
        existing.unsettled += r.amount_total ?? 0;
      }
      statsMap.set(r.event_id, existing);
    }

    const result = events
      .filter((e) => tieredEventIds.has(e.id!))
      .map((e) => {
        const s = statsMap.get(e.id!) ?? { gross: 0, unsettled: 0, sold: 0 };
        const endDate = e.end ?? null;
        const startDate = e.start ?? null;
        const deadlineBase = endDate ?? startDate;
        const settlementDeadline = deadlineBase
          ? new Date(new Date(deadlineBase).getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()
          : null;
        return {
          id: e.id,
          name: e.name,
          start: startDate,
          end: endDate,
          status: e.status,
          total_gross: s.gross,
          unsettled_amount: s.unsettled,
          total_sold: s.sold,
          settlement_deadline: settlementDeadline,
        };
      });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("[admin events list] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
