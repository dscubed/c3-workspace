import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@c3/supabase/admin";
import { requireClubAdmin } from "@/lib/auth/clubGuard";

export async function GET(req: NextRequest) {
  const clubId = req.nextUrl.searchParams.get("club_id");
  const auth = await requireClubAdmin(clubId);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { data: row } = await supabaseAdmin
    .from("club_stripe_accounts")
    .select("stripe_account_id, charges_enabled, payouts_enabled, connected_at")
    .eq("club_id", auth.clubId)
    .maybeSingle();

  return NextResponse.json({
    data: {
      stripe_account_id: row?.stripe_account_id ?? null,
      charges_enabled: row?.charges_enabled ?? false,
      payouts_enabled: row?.payouts_enabled ?? false,
      connected_at: row?.connected_at ?? null,
    },
  });
}
