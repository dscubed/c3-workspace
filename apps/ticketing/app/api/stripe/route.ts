import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/serverInstance";
import { sendTicketEmail } from "@/lib/events/check-in/sendTicketEmail";
import { generateQRCodeBuffer, signPayload } from "@/lib/events/qr";
import { supabaseAdmin } from "@c3/supabase/admin";

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
      console.log("STRIPE: handling checkout.session.completed")
      const _session = event.data.object as Stripe.Checkout.Session;
      if (!_session.metadata) {
        throw new Error("Metadata missing");
      }

      const eventId = _session.metadata.event_id;
      const userId = _session.metadata.user_id || null;

      // Restore attendee data from metadata (set by checkout.ts)
      let attendeeData: Record<string, unknown> = {};
      try {
        if (_session.metadata.attendee_data) {
          attendeeData = JSON.parse(_session.metadata.attendee_data);
        }
      } catch {
        // metadata parsing failed — use empty defaults
      }

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

      // Extract identity fields from attendeeData (set by CheckoutContext)
      const coreAttendee = (attendeeData["0"] as Record<string, unknown>) ?? {};
      const regEmail =
        (coreAttendee["email"] as string) || email;
      const regFirstName =
        (coreAttendee["first_name"] as string) || firstName;
      const regLastName =
        (coreAttendee["last_name"] as string) ||
        fullName.split(" ").slice(1).join(" ") ||
        "";
      const studentId = (coreAttendee["student_id"] as string) ?? null;
      const course = (coreAttendee["course"] as string) ?? null;

      // Build the custom_fields JSON from non-core keys
      const coreKeys = new Set(["first_name", "last_name", "email", "student_id", "course"]);
      const customFieldsJson: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(coreAttendee)) {
        if (!coreKeys.has(key)) {
          customFieldsJson[key] = value;
        }
      }

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

      // Create registration row with restored attendee data
      const { data: registration } = await supabaseAdmin
        .from("event_registrations")
        .insert({
          event_id: eventId,
          user_id: userId,
          type: "ticket",
          email: regEmail.toLowerCase(),
          first_name: regFirstName,
          last_name: regLastName,
          student_id: studentId,
          course: course,
          attendee_data: customFieldsJson,
          stripe_session_id: completeSession.id,
        })
        .select("id, qr_code_id")
        .single();

      if (registration) {
        console.log("STRIPE: generating QR code");
        const ticketSecret = process.env.TICKET_SECRET;
        if (!ticketSecret) throw new Error("TICKET_SECRET env var is not set");
        const qrPayload = signPayload("ticket", registration.qr_code_id, ticketSecret);
        const qrBuffer = await generateQRCodeBuffer(qrPayload);

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
