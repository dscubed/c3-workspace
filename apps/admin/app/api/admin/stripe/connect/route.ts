import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@c3/supabase/admin";
import { stripe } from "@/lib/stripe/serverInstance";
import { requireClubAdmin } from "@/lib/auth/clubGuard";

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3002";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const clubId: string | null = body.club_id;
    const auth = await requireClubAdmin(clubId);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { data: existing } = await supabaseAdmin
      .from("club_stripe_accounts")
      .select("stripe_account_id")
      .eq("club_id", auth.clubId)
      .maybeSingle();

    let accountId = existing?.stripe_account_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        country: "AU",
        email: auth.user.email ?? undefined,
        metadata: {
          club_id: auth.clubId,
        },
      });

      accountId = account.id;

      await supabaseAdmin
        .from("club_stripe_accounts")
        .upsert(
          { club_id: auth.clubId, stripe_account_id: accountId },
          { onConflict: "club_id" },
        );
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      type: "account_onboarding",
      refresh_url: `${ADMIN_URL}/api/admin/stripe/connect-refresh?club_id=${auth.clubId}`,
      return_url: `${ADMIN_URL}/api/admin/stripe/return?club_id=${auth.clubId}`,
    });

    return NextResponse.json({ data: { url: accountLink.url } });
  } catch (error) {
    console.error("[stripe connect] error:", error);

    const message =
      error instanceof Error ? error.message : "Internal server error";
    const isConnectNotEnabled = message.includes("signed up for Connect");

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
