import { Resend } from "resend";
import { TicketEmailTemplate } from "@/components/templates/ticket-email";
import { RegistrationEmailTemplate } from "@/components/templates/registration-email";

const resend = new Resend(process.env.RESEND_API_KEY!);

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
 * Used for ticketed events — attendee must show QR at the door.
 */
export async function sendTicketEmail(
  params: BaseEmailParams & { orderId: string },
) {
  const {
    email,
    firstName,
    eventName,
    qrBuffer,
    orderId,
    eventDate,
    venueName,
    thumbnailUrl,
  } = params;

  const { error } = await resend.emails.send({
    from: "Connect3 <ticketing@mail.connect3.app>",
    to: [email],
    subject: `Your ticket for ${eventName}`,
    attachments: [
      {
        filename: "ticket-qr.png",
        content: qrBuffer.toString("base64"),
        contentId: "ticket-qr",
      },
    ],
    react: TicketEmailTemplate({
      firstName,
      eventName,
      orderId,
      ticketQrCodeUrl: "cid:ticket-qr",
      eventDate,
      venueName,
      thumbnailUrl,
    }),
  });

  if (error) throw new Error("Failed to send ticket email");
}

/**
 * Sends a registration confirmation email with QR attendance code.
 * Used for non-ticketed events — attendee scans QR to log attendance and earn rewards.
 */
export async function sendRegistrationEmail(
  params: BaseEmailParams & { registrationId: string },
) {
  const {
    email,
    firstName,
    eventName,
    qrBuffer,
    registrationId,
    eventDate,
    venueName,
    thumbnailUrl,
  } = params;

  const { error } = await resend.emails.send({
    from: "Connect3 <ticketing@mail.connect3.app>",
    to: [email],
    subject: `You're registered for ${eventName}`,
    attachments: [
      {
        filename: "attendance-qr.png",
        content: qrBuffer.toString("base64"),
        contentId: "attendance-qr",
      },
    ],
    react: RegistrationEmailTemplate({
      firstName,
      eventName,
      registrationId,
      qrCodeUrl: "cid:attendance-qr",
      eventDate,
      venueName,
      thumbnailUrl,
    }),
  });

  if (error) throw new Error("Failed to send registration email");
}
