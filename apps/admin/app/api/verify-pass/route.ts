import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@c3/supabase/server";
import { supabaseAdmin } from "@c3/supabase";
import { verifyPayload } from "@c3/qr";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const raw: unknown = body?.raw;

  if (!raw || typeof raw !== "string") {
    return NextResponse.json({ error: "Missing raw" }, { status: 400 });
  }

  const secret = process.env.PASS_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const verified = verifyPayload(raw, secret);
  if (!verified || verified.prefix !== "pass") {
    return NextResponse.json({ error: "Invalid pass QR" }, { status: 400 });
  }

  const { data: tokenRow } = await supabaseAdmin
    .from("pass_tokens")
    .select("user_id")
    .eq("id", verified.id)
    .maybeSingle();

  if (!tokenRow) {
    return NextResponse.json({ error: "Pass not found or revoked" }, { status: 404 });
  }

  const userId = tokenRow.user_id as string;

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("first_name, last_name, university")
      .eq("id", userId)
      .single(),
    supabaseAdmin
      .from("club_memberships")
      .select("club_id, verified_at, club_membership_products(product_name)")
      .eq("user_id", userId),
  ]);

  return NextResponse.json({
    name: [profile?.first_name, profile?.last_name].filter(Boolean).join(" "),
    university: profile?.university ?? null,
    memberships: (memberships ?? []).map((m) => ({
      club_id: m.club_id,
      product_name: (m.club_membership_products as unknown as { product_name: string } | null)?.product_name ?? null,
      verified_at: m.verified_at,
    })),
  });
}
