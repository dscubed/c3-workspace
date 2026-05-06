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

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select(
        "stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_connected_at",
      )
      .eq("id", user.id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        stripe_account_id: profile.stripe_account_id ?? null,
        charges_enabled: profile.stripe_charges_enabled,
        payouts_enabled: profile.stripe_payouts_enabled,
        connected_at: profile.stripe_connected_at ?? null,
      },
    });
  } catch (error) {
    console.error("[stripe status] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
