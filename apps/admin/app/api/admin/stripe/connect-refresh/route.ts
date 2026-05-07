import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@c3/supabase/admin";
import { stripe } from "@/lib/stripe/serverInstance";
import { requireClubAdmin } from "@/lib/auth/clubGuard";

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3002";

export async function GET(req: NextRequest) {
  try {
    const clubId = req.nextUrl.searchParams.get("club_id");
    const auth = await requireClubAdmin(clubId);
    if ("error" in auth) {
      return NextResponse.redirect(
        `${ADMIN_URL}/dashboard/payment?error=${auth.error}`,
      );
    }

    const { data: row } = await supabaseAdmin
      .from("club_stripe_accounts")
      .select("stripe_account_id")
      .eq("club_id", auth.clubId)
      .maybeSingle();

    if (!row?.stripe_account_id) {
      return NextResponse.redirect(
        `${ADMIN_URL}/dashboard/payment?error=no_account`,
      );
    }

    const accountLink = await stripe.accountLinks.create({
      account: row.stripe_account_id,
      type: "account_onboarding",
      refresh_url: `${ADMIN_URL}/api/admin/stripe/connect-refresh?club_id=${auth.clubId}`,
      return_url: `${ADMIN_URL}/api/admin/stripe/return?club_id=${auth.clubId}`,
    });

    return NextResponse.redirect(accountLink.url);
  } catch (error) {
    console.error("[stripe connect-refresh] error:", error);
    return NextResponse.redirect(`${ADMIN_URL}/dashboard/payment?error=stripe`);
  }
}
