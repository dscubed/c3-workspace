import { NextResponse } from "next/server";
import { createClient } from "@c3/supabase/server";
import { supabaseAdmin } from "@c3/supabase/admin";
import { stripe } from "@/lib/stripe/serverInstance";

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

    const loginLink = await stripe.accounts.createLoginLink(
      profile.stripe_account_id,
    );

    return NextResponse.json({ data: { url: loginLink.url } });
  } catch (error) {
    console.error("[stripe dashboard] error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
