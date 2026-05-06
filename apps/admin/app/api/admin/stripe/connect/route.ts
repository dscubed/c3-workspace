import { NextResponse } from "next/server";
import { createClient } from "@c3/supabase/server";
import { supabaseAdmin } from "@c3/supabase/admin";
import { stripe } from "@/lib/stripe/serverInstance";

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3002";

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
      .select("id, first_name, stripe_account_id")
      .eq("id", user.id)
      .single();

    if (profileErr || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    let accountId = profile.stripe_account_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "AU",
        email: user.email ?? undefined,
        metadata: {
          profile_id: profile.id,
          club_name: profile.first_name ?? "",
        },
      });

      accountId = account.id;

      await supabaseAdmin
        .from("profiles")
        .update({ stripe_account_id: accountId })
        .eq("id", profile.id);
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: `${ADMIN_URL}/dashboard/payment?refresh=1`,
      return_url: `${ADMIN_URL}/api/admin/stripe/return`,
    });

    return NextResponse.json({ data: { url: accountLink.url } });
  } catch (error) {
    console.error("[stripe connect] error:", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";
    const isConnectNotEnabled = message.includes(
      "signed up for Connect",
    );

    return NextResponse.json(
      {
        error: isConnectNotEnabled
          ? "Stripe Connect is not enabled on your platform account. Activate it at https://dashboard.stripe.com/connect"
          : message,
      },
      { status: 500 },
    );
  }
}
