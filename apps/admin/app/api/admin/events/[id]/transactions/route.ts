import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@c3/supabase/server";
import { supabaseAdmin } from "@c3/supabase/admin";
import { checkEventPermission } from "@c3/supabase/club-admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const perm = await checkEventPermission(eventId, user.id);
    if (!perm.isCreator && !perm.isCollaborator && !perm.isClubAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: registrations, error: regErr } = await supabaseAdmin
      .from("event_registrations")
      .select(`
        id,
        email,
        first_name,
        last_name,
        tier_id,
        amount_total,
        payout_settled,
        created_at,
        stripe_session_id,
        event_ticket_tiers!inner(name)
      `)
      .eq("event_id", eventId)
      .eq("type", "ticket")
      .order("created_at", { ascending: false });

    if (regErr) {
      console.error("[transactions] query error:", regErr);
      return NextResponse.json({ error: "Failed to load transactions" }, { status: 500 });
    }

    const rows = (registrations ?? []).map((r) => {
      const tier = r.event_ticket_tiers as { name: string } | { name: string }[] | null;
      const tierName = Array.isArray(tier) ? tier[0]?.name : tier?.name;
      return {
        id: r.id,
        email: r.email,
        first_name: r.first_name,
        last_name: r.last_name,
        tier_name: tierName ?? null,
        amount_total: r.amount_total,
        payout_settled: r.payout_settled,
        created_at: r.created_at,
        stripe_session_id: r.stripe_session_id,
      };
    });

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error("GET /api/admin/events/[id]/transactions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
