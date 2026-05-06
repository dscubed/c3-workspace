import { createHash, randomInt } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@c3/supabase/admin";
import { Resend } from "resend";

function hashOtp(otp: string): string {
  return createHash("sha256").update(otp).digest("hex");
}

function otpEmailHtml(otp: string, clubName: string, siteUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /></head>
<body style="margin:0;padding:0;background:#f9f9fb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">

        <tr><td style="padding-bottom:32px;text-align:center">
          <img src="${siteUrl}/logo.png" alt="Connect3" width="32" height="28" style="display:inline-block;margin-right:8px;vertical-align:middle" />
          <span style="font-size:22px;font-weight:800;color:#854ecb;letter-spacing:-0.5px">Connect3</span>
        </td></tr>

        <tr><td style="background:#ffffff;border-radius:20px;padding:40px 36px;box-shadow:0 1px 4px rgba(0,0,0,.06)">

          <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#111">Verify your club access</h1>
          <p style="margin:0 0 28px;font-size:15px;color:#555;line-height:1.6">
            Hey <strong>${clubName}</strong> — use the code below to verify your club admin access on Connect3. It expires in <strong>10 minutes</strong>.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f6;border-radius:12px;padding:24px;margin-bottom:32px">
            <tr><td style="text-align:center">
              <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.8px">Verification Code</p>
              <p style="margin:0;font-size:36px;font-weight:700;color:#111;letter-spacing:10px;font-family:monospace">${otp}</p>
            </td></tr>
          </table>

          <p style="margin:0;font-size:14px;color:#555;line-height:1.7;border-top:1px solid #eee;padding-top:24px">
            If you did not request this code, you can safely ignore this email. No changes have been made to your account.
          </p>
          <p style="margin:16px 0 0;font-size:14px;color:#555">— The Connect3 Team</p>

        </td></tr>

        <tr><td style="padding-top:24px;text-align:center">
          <p style="margin:0;font-size:12px;color:#aaa">You're receiving this because a verification was requested for your club on Connect3.</p>
          <p style="margin:4px 0 0;font-size:12px;color:#aaa">
            Questions? <a href="${siteUrl}/contact" style="color:#aaa">Contact us</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const { club_id } = await req.json();

  if (!club_id || typeof club_id !== "string") {
    return NextResponse.json({ error: "Club ID required" }, { status: 400 });
  }

  const { data: row, error: lookupError } = await supabaseAdmin
    .from("club_onboardings")
     .select("club_email, onboarded_at")
    .eq("club_id", club_id)
    .maybeSingle();

  if (lookupError || !row) {
    return NextResponse.json(
      { error: "Club not found for onboarding" },
      { status: 404 },
    );
  }

  if (row.onboarded_at) {
    return NextResponse.json(
      { error: "Already onboarded" },
      { status: 409 },
    );
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("first_name")
    .eq("id", club_id)
    .single();

  const clubName = profile?.first_name ?? "Club";

  const otp = randomInt(100000, 999999).toString();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const { error: upsertError } = await supabaseAdmin
    .from("club_onboardings")
    .upsert({
      club_id,
      club_email: row.club_email,
      otp_hash: otpHash,
      expires_at: expiresAt,
    });

  if (upsertError) {
    console.error("club_onboardings upsert error:", upsertError);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set");
    return NextResponse.json({ error: "Email service not configured" }, { status: 500 });
  }

  const supportSendEmail = process.env.NOREPLY_EMAIL ?? "noreply@mail.connect3.app";
  const targetEmail = row.club_email;

  console.log("[send-otp] sending OTP", { club_id, to: targetEmail, from: supportSendEmail, otp });

  const resend = new Resend(apiKey);

  try {
    const result = await resend.emails.send({
      from: `Connect3 <${supportSendEmail}>`,
      to: [targetEmail],
      subject: `Your verification code: ${otp}`,
      html: otpEmailHtml(otp, clubName, process.env.NEXT_PUBLIC_CONNECT3_URL ?? "http://localhost:3002"),
    });

    if (result.error) {
      console.error("[send-otp] Resend error:", result.error);
      return NextResponse.json(
        { error: `Failed to send OTP email: ${result.error.message}` },
        { status: 500 },
      );
    }

    console.log("[send-otp] email sent successfully", { id: result.data?.id });
  } catch (emailError) {
    console.error("[send-otp] Resend exception:", emailError);
    return NextResponse.json(
      { error: "Failed to send OTP email" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}
