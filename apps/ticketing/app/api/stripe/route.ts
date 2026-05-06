import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/serverInstance";
import { sendTicketEmail } from "@/lib/events/check-in/sendTicketEmail";
import { generateQRCodeBuffer, signPayload } from "@/lib/events/qr";
import { supabaseAdmin } from "@c3/supabase/admin";
import type { AttendeeData } from "@c3/types";

const allowedEvents: Stripe.Event.Type[] = [
  "checkout.session.completed",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
];

interface CheckoutPayload {
  id: string;
  event_id: string;
  tier_id: string | null;
  user_id: string | null;
  quantity: number;
  attendee_data: AttendeeData;
  custom_fields: unknown;
  consumed_at: string | null;
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = (await headers()).get("Stripe-Signature");

    if (!signature) {
      return new Response("Missing Stripe signature", { status: 401 });
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );

    if (!allowedEvents.includes(event.type)) {
      return new Response("Event type not allowed", { status: 200 });
    }

    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      return Response.json("Purchase success", { status: 200 });
    }

    if (event.type === "payment_intent.succeeded") {
      console.log("[stripe webhook] payment_intent.succeeded");
    }
    if (event.type === "payment_intent.payment_failed") {
      console.log("[stripe webhook] payment_intent.payment_failed");
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("[stripe webhook] error:", err);
    return new Response(
      `Webhook error: ${err instanceof Error ? err.message : "Unknown error"}`,
      { status: 400 },
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const md = session.metadata ?? {};
  const eventId = md.event_id;
  const tierId = md.tier_id || null;
  const payloadId = md.payload_id || null;

  if (!eventId) {
    throw new Error("[stripe webhook] event_id missing in metadata");
  }

  // Idempotency — bail if we already wrote registrations for this session
  const { data: existing } = await supabaseAdmin
    .from("event_registrations")
    .select("id")
    .eq("stripe_session_id", session.id)
    .limit(1);
  if (existing && existing.length > 0) {
    console.log("[stripe webhook] already processed", session.id);
    return;
  }

  // Load checkout payload (attendee data + custom fields)
  let payload: CheckoutPayload | null = null;
  if (payloadId) {
    const { data } = await supabaseAdmin
      .from("checkout_payloads")
      .select("*")
      .eq("id", payloadId)
      .single();
    payload = data as CheckoutPayload | null;
  }

  // Identity: prefer attendee_data[0], fall back to Stripe customer details
  const customer = session.customer_details;
  const fallbackEmail = customer?.email ?? "";
  const fallbackName = customer?.name ?? "";
  const fallbackFirst = fallbackName.split(" ")[0] || "there";
  const fallbackLast = fallbackName.split(" ").slice(1).join(" ") || "";

  const attendeeData: AttendeeData = payload?.attendee_data ?? {};
  const slot0 = (attendeeData[0] ?? {}) as Record<string, string>;

  const firstName =
    (slot0.first_name as string | undefined) ?? fallbackFirst;
  const lastName =
    (slot0.last_name as string | undefined) ?? fallbackLast;
  const email = (
    (slot0.email as string | undefined) ?? fallbackEmail
  ).toLowerCase();

  if (!email) {
    console.warn("[stripe webhook] missing email — skipping");
    return;
  }

  const {
    first_name: _fn,
    last_name: _ln,
    email: _em,
    student_id: _sid,
    course: _course,
    ...customFields
  } = slot0;

  // Fetch event details for the email
  const { data: eventRow } = await supabaseAdmin
    .from("events")
    .select(
      "name, start, event_venues(venue), event_images(url, sort_order)",
    )
    .eq("id", eventId)
    .single();

  const eventDate = eventRow?.start
    ? new Date(eventRow.start).toLocaleDateString("en-AU", {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : undefined;
  const venues = eventRow?.event_venues as { venue: string | null }[] | null;
  const venueName = venues?.[0]?.venue ?? undefined;
  const images = eventRow?.event_images as
    | { url: string; sort_order: number }[]
    | null;
  const thumbnailUrl =
    (images ?? []).slice().sort((a, b) => a.sort_order - b.sort_order)[0]
      ?.url ?? null;

  const { data: registration, error: regErr } = await supabaseAdmin
    .from("event_registrations")
    .insert({
      event_id: eventId,
      user_id: payload?.user_id ?? null,
      type: "ticket",
      email,
      first_name: firstName,
      last_name: lastName,
      student_id: (slot0.student_id as string | undefined) ?? null,
      course: (slot0.course as string | undefined) ?? null,
      attendee_data: customFields,
      stripe_session_id: session.id,
      tier_id: tierId,
      quantity: 1,
      amount_total: session.amount_total ?? null,
    })
    .select("id, qr_code_id")
    .single();

  if (regErr || !registration) {
    console.error("[stripe webhook] registration insert failed:", regErr);
    return;
  }

  // Generate QR + send confirmation email
  const ticketSecret = process.env.TICKET_SECRET;
  if (!ticketSecret) throw new Error("TICKET_SECRET env var is not set");
  const qrPayload = signPayload(
    "ticket",
    registration.qr_code_id,
    ticketSecret,
  );
  const qrBuffer = await generateQRCodeBuffer(qrPayload);

  try {
    await sendTicketEmail({
      email,
      firstName: firstName || "there",
      eventName: eventRow?.name ?? "Event",
      qrBuffer,
      orderId: session.id,
      eventDate,
      venueName,
      thumbnailUrl,
    });
  } catch (err) {
    console.error("[stripe webhook] email send failed:", err);
  }

  // Mark payload consumed
  if (payload) {
    await supabaseAdmin
      .from("checkout_payloads")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", payload.id);
  }

  console.log(`[stripe webhook] processed ticket for ${eventId}`);
}
