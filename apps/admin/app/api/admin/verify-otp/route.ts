import { createHash, randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@c3/supabase/admin";

const COOKIE_NAME = "c3_onboard_session";
const SESSION_TTL_MS = 10 * 60 * 1000; // 10 minutes

function hashOtp(otp: string): string {
  return createHash("sha256").update(otp).digest("hex");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function POST(req: NextRequest) {
  const { club_id, otp } = await req.json();

  if (!club_id || !otp) {
    return NextResponse.json(
      { error: "Club ID and OTP required" },
      { status: 400 },
    );
  }

  const { data: row, error } = await supabaseAdmin
    .from("club_onboardings")
    .select("otp_hash, expires_at, onboarded_at")
    .eq("club_id", club_id)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json(
      { error: "Invalid or expired OTP" },
      { status: 401 },
    );
  }

  if (row.onboarded_at) {
    return NextResponse.json({ error: "Already onboarded" }, { status: 409 });
  }

  if (!row.otp_hash || !row.expires_at) {
    return NextResponse.json({ error: "No OTP requested" }, { status: 400 });
  }

  if (new Date(row.expires_at) < new Date()) {
    return NextResponse.json({ error: "OTP expired" }, { status: 401 });
  }

  if (hashOtp(otp) !== row.otp_hash) {
    return NextResponse.json({ error: "Incorrect OTP" }, { status: 401 });
  }

  // Mark verified + clear OTP
  await supabaseAdmin
    .from("club_onboardings")
    .update({ otp_hash: null, expires_at: null, otp_verified: true })
    .eq("club_id", club_id);

  // Issue a session token — allows multiple concurrent sessions
  const rawToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  const { error: sessionError } = await supabaseAdmin
    .from("club_onboarding_sessions")
    .insert({ club_id, token_hash: hashToken(rawToken), expires_at: expiresAt });

  if (sessionError) {
    console.error("[verify-otp] session insert error:", sessionError);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  const cookieValue = `${club_id}:${rawToken}`;
  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_TTL_MS / 1000,
    path: "/",
  });

  return response;
}
