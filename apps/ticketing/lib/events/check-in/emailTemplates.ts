/**
 * HTML email templates for ticketing flows.
 * Style mirrors the club onboarding OTP email — purple Connect3 logo header,
 * white rounded card, table-based layout for email-client compatibility.
 */

interface BaseProps {
  firstName: string;
  eventName: string;
  eventDate?: string;
  venueName?: string;
  thumbnailUrl?: string | null;
  /** Connect3 site URL (for logo + footer links) */
  siteUrl: string;
}

function shell(inner: string, siteUrl: string): string {
  return `<!DOCTYPE html>
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

        ${inner}

        <tr><td style="padding-top:24px;text-align:center">
          <p style="margin:0;font-size:12px;color:#aaa">You're receiving this because you signed up for an event on Connect3.</p>
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

function meta(eventDate?: string, venueName?: string): string {
  const parts = [eventDate, venueName].filter(Boolean);
  if (!parts.length) return "";
  return `<p style="margin:8px 0 0;font-size:13px;color:#777">${parts.join(" · ")}</p>`;
}

function thumbnail(url?: string | null, alt?: string): string {
  if (!url) return "";
  return `<img src="${url}" alt="${alt ?? ""}" style="display:block;width:100%;max-height:200px;object-fit:cover;border-radius:12px;margin-bottom:24px" />`;
}

export interface TicketEmailProps extends BaseProps {
  orderId: string;
  /** CID reference (e.g. "cid:ticket-qr") for the QR attachment */
  qrCid: string;
}

export function buildTicketEmailHtml(p: TicketEmailProps): string {
  const inner = `
        <tr><td style="background:#ffffff;border-radius:20px;padding:40px 36px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
          ${thumbnail(p.thumbnailUrl, p.eventName)}
          <p style="margin:0 0 6px;font-size:13px;color:#854ecb;font-weight:600;text-transform:uppercase;letter-spacing:.6px">You're in, ${p.firstName}</p>
          <h1 style="margin:0 0 4px;font-size:24px;font-weight:700;color:#111;line-height:1.3">${p.eventName}</h1>
          ${meta(p.eventDate, p.venueName)}

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;background:#f4f4f6;border-radius:12px;padding:28px">
            <tr><td style="text-align:center">
              <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.8px">Show at the door</p>
              <img src="${p.qrCid}" alt="Entry QR" width="180" height="180" style="display:inline-block;border:1px solid #e5e5ea;border-radius:12px;background:#fff;padding:8px" />
              <p style="margin:14px 0 0;font-size:13px;color:#666;line-height:1.6">Have this QR code ready when you arrive — it&apos;s your entry pass.</p>
            </td></tr>
          </table>

          <p style="margin:24px 0 0;font-size:12px;color:#aaa;border-top:1px solid #eee;padding-top:18px">
            Order reference: <code style="font-family:monospace">${p.orderId}</code>
          </p>
        </td></tr>`;
  return shell(inner, p.siteUrl);
}

export interface RegistrationEmailProps extends BaseProps {
  registrationId: string;
  qrCid: string;
}

export function buildRegistrationEmailHtml(p: RegistrationEmailProps): string {
  const inner = `
        <tr><td style="background:#ffffff;border-radius:20px;padding:40px 36px;box-shadow:0 1px 4px rgba(0,0,0,.06)">
          ${thumbnail(p.thumbnailUrl, p.eventName)}
          <p style="margin:0 0 6px;font-size:13px;color:#854ecb;font-weight:600;text-transform:uppercase;letter-spacing:.6px">You're registered, ${p.firstName}</p>
          <h1 style="margin:0 0 4px;font-size:24px;font-weight:700;color:#111;line-height:1.3">${p.eventName}</h1>
          ${meta(p.eventDate, p.venueName)}

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:32px;background:#f4f4f6;border-radius:12px;padding:28px">
            <tr><td style="text-align:center">
              <p style="margin:0 0 8px;font-size:11px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:.8px">Attendance code</p>
              <img src="${p.qrCid}" alt="Attendance QR" width="180" height="180" style="display:inline-block;border:1px solid #e5e5ea;border-radius:12px;background:#fff;padding:8px" />
              <p style="margin:14px 0 0;font-size:13px;color:#666;line-height:1.6">Scan this on arrival to log attendance and earn rewards.</p>
            </td></tr>
          </table>

          <p style="margin:24px 0 0;font-size:12px;color:#aaa;border-top:1px solid #eee;padding-top:18px">
            Reference: <code style="font-family:monospace">${p.registrationId}</code>
          </p>
        </td></tr>`;
  return shell(inner, p.siteUrl);
}
