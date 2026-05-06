import { NextResponse } from "next/server";
import { createClient } from "@c3/supabase/server";
import { supabaseAdmin } from "@c3/supabase/admin";
import { stripe } from "@/lib/stripe/serverInstance";

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3002";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(`${ADMIN_URL}/dashboard/payment?error=auth`);
    }

    const { data: profile, error: profileErr } = await supabaseAdmin
      .from("profiles")
      .select("stripe_account_id, stripe_connected_at")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile || !profile.stripe_account_id) {
      return NextResponse.redirect(
        `${ADMIN_URL}/dashboard/payment?error=no_account`,
      );
    }

    const account = await stripe.accounts.retrieve(profile.stripe_account_id);

    const firstTimeConnected = !profile.stripe_connected_at && account.charges_enabled;

    await supabaseAdmin
      .from("profiles")
      .update({
        stripe_charges_enabled: account.charges_enabled,
        stripe_payouts_enabled: account.payouts_enabled,
        ...(firstTimeConnected
          ? { stripe_connected_at: new Date().toISOString() }
          : {}),
      })
      .eq("id", user.id);

    return NextResponse.redirect(
      `${ADMIN_URL}/dashboard/payment?onboarding=complete`,
    );
  } catch (error) {
    console.error("[stripe return] error:", error);
    return NextResponse.redirect(`${ADMIN_URL}/dashboard/payment?error=stripe`);
  }
}
