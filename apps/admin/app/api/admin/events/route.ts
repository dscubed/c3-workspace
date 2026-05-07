import { NextResponse } from "next/server";
import { createClient } from "@c3/supabase/server";
import { supabaseAdmin } from "@c3/supabase/admin";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Events the user created that have ticket tiers
    const { data: events, error: eventsErr } = await supabaseAdmin
      .from("events")
      .select("id, name, start, status")
      .eq("creator_profile_id", user.id)
      .order("start", { ascending: false });

    if (eventsErr) {
      return NextResponse.json({ error: "Failed to query events" }, { status: 500 });
    }

    if (!events || events.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const eventIds = events.map((e) => e.id);

    // Check which events have ticket tiers
    const { data: tieredEvents } = await supabaseAdmin
      .from("event_ticket_tiers")
      .select("event_id")
      .in("event_id", eventIds);

    const tieredEventIds = new Set((tieredEvents ?? []).map((t) => t.event_id));

    // Revenue stats from registrations
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
      .filter((e) => tieredEventIds.has(e.id))
      .map((e) => {
        const s = statsMap.get(e.id) ?? { gross: 0, unsettled: 0, sold: 0 };
        // Payout deadline: 30 days after event start (or null if no start)
        const payoutDeadline = e.start
          ? new Date(new Date(e.start).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
          : null;
        return {
          id: e.id,
          name: e.name,
          start: e.start,
          status: e.status,
          total_gross: s.gross,
          unsettled_amount: s.unsettled,
          total_sold: s.sold,
          payout_deadline: payoutDeadline,
        };
      });

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error("[admin events list] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
