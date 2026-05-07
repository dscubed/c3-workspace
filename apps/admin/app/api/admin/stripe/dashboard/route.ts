import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@c3/supabase/admin";
import { stripe } from "@/lib/stripe/serverInstance";
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

    const loginLink = await stripe.accounts.createLoginLink(
      row.stripe_account_id,
    );

    return NextResponse.json({ data: { url: loginLink.url } });
  } catch (error) {
    console.error("[stripe dashboard] error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}
