import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@c3/supabase/server";
import { supabaseAdmin } from "@c3/supabase/admin";
import { checkEventPermission } from "@/lib/auth/clubAdmin";

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

    const { data: splits } = await supabaseAdmin
      .from("event_payout_splits")
      .select("id, event_id, club_id, percentage, created_at, profiles(id, first_name, avatar_url, stripe_account_id, stripe_charges_enabled)")
      .eq("event_id", eventId);

    return NextResponse.json({ data: splits ?? [] });
  } catch (error) {
    console.error("GET /api/events/[id]/splits error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
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

    const { data: event } = await supabaseAdmin
      .from("events")
      .select("creator_profile_id")
      .eq("id", eventId)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const body = await request.json();
    const splits: { club_id: string; percentage: number }[] = body.splits ?? [];

    if (splits.length === 0) {
      return NextResponse.json(
        { error: "At least one split is required" },
        { status: 400 },
      );
    }

    const sum = splits.reduce((s, split) => s + split.percentage, 0);
    if (Math.abs(sum - 100) > 0.01) {
      return NextResponse.json(
        { error: `Split percentages must sum to 100 (currently ${sum})` },
        { status: 400 },
      );
    }

    const clubIds = splits.map((s) => s.club_id);

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, stripe_account_id, stripe_charges_enabled")
      .in("id", clubIds);

    const profileMap = new Map(
      (profiles ?? []).map((p) => [p.id, p]),
    );

    for (const split of splits) {
      const p = profileMap.get(split.club_id);
      if (!p) {
        return NextResponse.json(
          { error: `Club ${split.club_id} not found` },
          { status: 400 },
        );
      }
      if (!p.stripe_account_id) {
        return NextResponse.json(
          {
            error: `Club ${split.club_id} has not connected Stripe`,
          },
          { status: 400 },
        );
      }
      if (!p.stripe_charges_enabled) {
        return NextResponse.json(
          {
            error: `Club ${split.club_id} has not completed Stripe onboarding`,
          },
          { status: 400 },
        );
      }
    }

    const { data: settledRegs } = await supabaseAdmin
      .from("event_registrations")
      .select("id")
      .eq("event_id", eventId)
      .eq("type", "ticket")
      .eq("payout_settled", true)
      .limit(1);

    if (settledRegs && settledRegs.length > 0) {
      return NextResponse.json(
        { error: "Cannot change splits after a payout has been processed" },
        { status: 400 },
      );
    }

    const rows = splits.map((s) => ({
      event_id: eventId,
      club_id: s.club_id,
      percentage: s.percentage,
    }));

    const { data: upserted, error: upsertErr } = await supabaseAdmin
      .from("event_payout_splits")
      .upsert(rows, { onConflict: "event_id,club_id" })
      .select("id, event_id, club_id, percentage, created_at");

    if (upsertErr) {
      console.error("[splits PUT] upsert error:", upsertErr);
      return NextResponse.json(
        { error: "Failed to save splits" },
        { status: 500 },
      );
    }

    const keepIds = new Set(
      (upserted ?? []).map((r) => r.id),
    );
    const { data: allSplits } = await supabaseAdmin
      .from("event_payout_splits")
      .select("id")
      .eq("event_id", eventId);

    const toDelete = (allSplits ?? [])
      .filter((s) => !keepIds.has(s.id))
      .map((s) => s.id);

    if (toDelete.length > 0) {
      await supabaseAdmin
        .from("event_payout_splits")
        .delete()
        .in("id", toDelete);
    }

    return NextResponse.json({ data: upserted });
  } catch (error) {
    console.error("PUT /api/events/[id]/splits error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
