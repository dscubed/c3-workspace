import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@c3/supabase/admin";
import { requireClubAdmin } from "@/lib/auth/clubGuard";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const clubId: string | null = body.club_id;
    const auth = await requireClubAdmin(clubId);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { data: row } = await supabaseAdmin
      .from("club_stripe_accounts")
      .select("stripe_account_id")
      .eq("club_id", auth.clubId)
      .maybeSingle();

    if (!row?.stripe_account_id) {
      return NextResponse.json(
        { error: "No Stripe account connected" },
        { status: 404 },
      );
    }

    const { data: unsettled } = await supabaseAdmin
      .from("event_registrations")
      .select("id, events!inner(creator_profile_id)")
      .eq("events.creator_profile_id", auth.clubId)
      .eq("payout_settled", false)
      .limit(1);

    if (unsettled && unsettled.length > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot disconnect: you have unsettled ticket sales. Wait for all payouts to complete first.",
        },
        { status: 400 },
      );
    }

    await supabaseAdmin
      .from("club_stripe_accounts")
      .delete()
      .eq("club_id", auth.clubId);

    return NextResponse.json({ data: { disconnected: true } });
  } catch (error) {
    console.error("[stripe disconnect] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
