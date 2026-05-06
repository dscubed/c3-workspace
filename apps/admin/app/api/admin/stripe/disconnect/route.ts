import { NextResponse } from "next/server";
import { createClient } from "@c3/supabase/server";
import { supabaseAdmin } from "@c3/supabase/admin";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("stripe_account_id")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile || !profile.stripe_account_id) {
      return NextResponse.json(
        { error: "No Stripe account connected" },
        { status: 404 },
      );
    }

    const { data: unsettled } = await supabaseAdmin
      .from("event_registrations")
      .select("id, events!inner(creator_profile_id)")
      .eq("events.creator_profile_id", user.id)
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
      .from("profiles")
      .update({
        stripe_account_id: null,
        stripe_charges_enabled: false,
        stripe_payouts_enabled: false,
      })
      .eq("id", user.id);

    return NextResponse.json({ data: { disconnected: true } });
  } catch (error) {
    console.error("[stripe disconnect] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
