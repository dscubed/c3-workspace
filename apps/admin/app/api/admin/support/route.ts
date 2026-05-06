import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const { type, data } = await req.json();

  if (!type || !data) {
    return NextResponse.json({ error: "type and data required" }, { status: 400 });
  }

  const supportEmail = process.env.SUPPORT_EMAIL ?? "support@mail.connect3.app";
  const noReply = process.env.NOREPLY_EMAIL ?? "noreply@mail.connect3.app";
  const resend = new Resend(process.env.RESEND_API_KEY);

  let subject = "";
  let html = "";
  let cc = "";

  if (type === "club_not_listed") {
    subject = "New club onboarding request";
    cc = data.club_email ?? "";
    html = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="margin:0 0 16px;font-size:20px;color:#111">Club Not Listed Request</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 12px;font-weight:600;font-size:13px;color:#555;width:120px">Club Name</td><td style="padding:8px 12px;font-size:14px;color:#111">${escape(data.club_name ?? "")}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:600;font-size:13px;color:#555">Email</td><td style="padding:8px 12px;font-size:14px;color:#111">${escape(data.club_email ?? "")}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:600;font-size:13px;color:#555">Instagram</td><td style="padding:8px 12px;font-size:14px;color:#111">${escape(data.instagram ?? "")}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:600;font-size:13px;color:#555">University</td><td style="padding:8px 12px;font-size:14px;color:#111">${escape(data.university ?? "")}</td></tr>
        </table>
      </div>
    `;
  } else if (type === "email_incorrect") {
    subject = "Email correction request";
    cc = data.correct_email ?? "";
    html = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <h2 style="margin:0 0 16px;font-size:20px;color:#111">Email Correction Request</h2>
        <table style="width:100%;border-collapse:collapse">
          <tr><td style="padding:8px 12px;font-weight:600;font-size:13px;color:#555;width:120px">First Name</td><td style="padding:8px 12px;font-size:14px;color:#111">${escape(data.first_name ?? "")}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:600;font-size:13px;color:#555">Last Name</td><td style="padding:8px 12px;font-size:14px;color:#111">${escape(data.last_name ?? "")}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:600;font-size:13px;color:#555">Role</td><td style="padding:8px 12px;font-size:14px;color:#111">${escape(data.role ?? "")}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:600;font-size:13px;color:#555">Correct Email</td><td style="padding:8px 12px;font-size:14px;color:#111">${escape(data.correct_email ?? "")}</td></tr>
        </table>
      </div>
    `;
  } else {
    return NextResponse.json({ error: "Unknown request type" }, { status: 400 });
  }

  try {
    await resend.emails.send({
      from: `Connect3 Admin <${noReply}>`,
      to: [supportEmail],
      cc: cc ? [cc] : undefined,
      subject,
      html,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[support] failed to send email:", err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}

function escape(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
