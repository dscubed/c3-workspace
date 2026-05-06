import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@c3/supabase/admin";

const COOKIE_NAME = "c3_onboard_session";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function validateSession(req: NextRequest, clubId: string): Promise<boolean> {
  const raw = req.cookies.get(COOKIE_NAME)?.value;
  if (!raw) return false;

  const [cookieClubId, rawToken] = raw.split(":");
  if (cookieClubId !== clubId || !rawToken) return false;

  const { data } = await supabaseAdmin
    .from("club_onboarding_sessions")
    .select("id")
    .eq("club_id", clubId)
    .eq("token_hash", hashToken(rawToken))
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  return !!data;
}

export async function POST(req: NextRequest) {
  const { club_id, email, password } = await req.json();

  if (!club_id || !email || !password) {
    return NextResponse.json(
      { error: "club_id, email, and password are required" },
      { status: 400 },
    );
  }

  const sessionValid = await validateSession(req, club_id);
  if (!sessionValid) {
    return NextResponse.json(
      { error: "Valid session required — please verify your OTP first" },
      { status: 401 },
    );
  }

  // Update email before auth ops
  await supabaseAdmin
    .from("club_onboardings")
    .update({ club_email: email })
    .eq("club_id", club_id);

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(club_id, {
    email,
    password,
    email_confirm: true,
  });

  if (updateError) {
    console.error("[finalize] updateUserById error:", updateError);
    return NextResponse.json(
      { error: updateError.message ?? "Failed to update account" },
      { status: 500 },
    );
  }

  const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (linkError || !linkData?.properties?.hashed_token) {
    console.error("[finalize] generateLink error:", linkError);
    return NextResponse.json(
      { error: linkError?.message ?? "Failed to generate magic link" },
      { status: 500 },
    );
  }

  // Atomic claim — prevents double-onboard under race conditions
  const { data: claimed } = await supabaseAdmin
    .from("club_onboardings")
    .update({ onboarded_at: new Date().toISOString() })
    .eq("club_id", club_id)
    .is("onboarded_at", null)
    .select("club_id")
    .maybeSingle();

  if (!claimed) {
    return NextResponse.json({ error: "Already onboarded" }, { status: 409 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_CONNECT3_URL ?? "http://localhost:3000";
  const magicLink = `${baseUrl}/auth/confirm?token_hash=${linkData.properties.hashed_token}&type=magiclink&next=/`;

  console.log("[finalize] onboarded", { club_id, email });

  return NextResponse.json({ data: { magicLink } });
}
