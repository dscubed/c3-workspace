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

export async function GET(req: NextRequest) {
  const clubId = req.nextUrl.searchParams.get("club_id");

  if (!clubId) {
    return NextResponse.json({ error: "club_id required" }, { status: 400 });
  }

  const { data: row, error } = await supabaseAdmin
    .from("club_onboardings")
    .select("club_email, otp_verified, onboarded_at")
    .eq("club_id", clubId)
    .maybeSingle();

  const sessionValid = await validateSession(req, clubId);

  if (error || !row) {
    return NextResponse.json({
      data: { club_email: null, otp_verified: false, onboarded: false, session_valid: false },
    });
  }

  return NextResponse.json({
    data: {
      club_email: row.club_email,
      otp_verified: !!row.otp_verified,
      onboarded: !!row.onboarded_at,
      session_valid: sessionValid,
    },
  });
}
