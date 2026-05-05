import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/serverInstance";
import { sendTicketEmail } from "@/lib/events/check-in/sendTicketEmail";
import { generateQRCodeBuffer } from "@/lib/events/qr";
import { supabaseAdmin } from "@c3/supabase/admin";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

// Allowed events for only one time payments
// Add more to support things like subscriptions
const allowedEvents: Stripe.Event.Type[] = [
  "checkout.session.completed",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
];
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

    console.log("EVENT TYPE", event.type);

    if (!allowedEvents.includes(event.type)) {
      return new Response("Event type not allowed", { status: 200 });
    }

    // Handle events
    if (event.type === "checkout.session.completed") {
      const _session = event.data.object as Stripe.Checkout.Session;
      if (!_session.metadata) {
        throw new Error("Metadata missing");
      }

      const eventId = _session.metadata.event_id;

      // Expand the current session to get more attributes
      const completeSession = await stripe.checkout.sessions.retrieve(
        _session.id,
        {
          expand: ["line_items", "line_items.data.price.product"],
        },
      );

      const email = completeSession.customer_details?.email ?? "";
      const fullName = completeSession.customer_details?.name ?? "";
      const firstName = fullName.split(" ")[0] || "there";

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
      const venues = eventRow?.event_venues as
        | { venue: string | null }[]
        | null;
      const venueName = venues?.[0]?.venue ?? undefined;
      const images = eventRow?.event_images as
        | { url: string; sort_order: number }[]
        | null;
      const thumbnailUrl = images?.[0]?.url ?? null;

      // Create registration row — email/first_name/last_name are real columns,
      // custom_fields holds any extra answers (empty for Stripe webhook path).
      const { data: registration } = await supabaseAdmin
        .from("event_registrations")
        .insert({
          event_id: eventId,
          user_id: null, // guest checkout — no user_id available from webhook
          type: "ticket",
          email: email.toLowerCase(),
          first_name: firstName,
          last_name: fullName.split(" ").slice(1).join(" ") || "",
          custom_fields: {},
          stripe_session_id: completeSession.id,
        })
        .select("id, qr_code_id")
        .single();

      if (registration) {
        const qrTarget = `${SITE_URL}/api/checkin/${registration.qr_code_id}`;
        const qrBuffer = await generateQRCodeBuffer(qrTarget);

        await sendTicketEmail({
          email,
          firstName,
          eventName: eventRow?.name ?? "Event",
          qrBuffer,
          orderId: completeSession.id,
          eventDate,
          venueName,
          thumbnailUrl,
        });
        console.log("Ticket email sent");
      }

      return Response.json("Purchase success", { status: 200 });
    }

    if (event.type === "payment_intent.succeeded") {
      console.log("Payment succeeded");
    }

    if (event.type === "payment_intent.payment_failed") {
      console.log("Payment failed");
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    return new Response(
      `Webhook error: ${err instanceof Error ? err.message : "Unknown error"}`,
      { status: 400 },
    );
  }
}
