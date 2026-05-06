import { Resend } from "resend";
import {
  buildTicketEmailHtml,
  buildRegistrationEmailHtml,
} from "./emailTemplates";

const resend = new Resend(process.env.RESEND_API_KEY!);

const SITE_URL =
  process.env.NEXT_PUBLIC_CONNECT3_URL ?? "https://connect3.app";
const FROM = "Connect3 <ticketing@mail.connect3.app>";

interface BaseEmailParams {
  email: string;
  firstName: string;
  eventName: string;
  qrBuffer: Buffer;
  eventDate?: string;
  venueName?: string;
  thumbnailUrl?: string | null;
}

/**
 * Sends a ticket confirmation email with QR entry pass.
 * Uses inline HTML template (matches onboarding OTP email style).
 */
export async function sendTicketEmail(
  params: BaseEmailParams & { orderId: string },
) {
  const html = buildTicketEmailHtml({
    firstName: params.firstName,
    eventName: params.eventName,
    eventDate: params.eventDate,
    venueName: params.venueName,
    thumbnailUrl: params.thumbnailUrl,
    orderId: params.orderId,
    qrCid: "cid:ticket-qr",
    siteUrl: SITE_URL,
  });

  const { error } = await resend.emails.send({
    from: FROM,
    to: [params.email],
    subject: `Your ticket for ${params.eventName}`,
    html,
    attachments: [
      {
        filename: "ticket-qr.png",
        content: params.qrBuffer.toString("base64"),
        contentId: "ticket-qr",
      },
    ],
  });

  if (error) {
    console.error("[sendTicketEmail] resend error:", error);
    throw new Error("Failed to send ticket email");
  }
}

/**
 * Sends a registration confirmation email with QR attendance code.
 */
export async function sendRegistrationEmail(
  params: BaseEmailParams & { registrationId: string },
) {
  const html = buildRegistrationEmailHtml({
    firstName: params.firstName,
    eventName: params.eventName,
    eventDate: params.eventDate,
    venueName: params.venueName,
    thumbnailUrl: params.thumbnailUrl,
    registrationId: params.registrationId,
    qrCid: "cid:attendance-qr",
    siteUrl: SITE_URL,
  });

  const { error } = await resend.emails.send({
    from: FROM,
    to: [params.email],
    subject: `You're registered for ${params.eventName}`,
    html,
    attachments: [
      {
        filename: "attendance-qr.png",
        content: params.qrBuffer.toString("base64"),
        contentId: "attendance-qr",
      },
    ],
  });

  if (error) {
    console.error("[sendRegistrationEmail] resend error:", error);
    throw new Error("Failed to send registration email");
  }
}
