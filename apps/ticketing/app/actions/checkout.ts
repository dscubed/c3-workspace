"use server";

import Stripe from "stripe";
import { redirect } from "next/navigation";
import { createClient } from "@c3/supabase/server";
import { supabaseAdmin } from "@c3/supabase/admin";
import { AttendeeData } from "@c3/types";
import { TicketingFieldDraft } from "@/lib/types/ticketing";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

/**
 * Creates a Stripe Checkout Session for a ticket purchase.
 *
 * Attendee data + custom field answers are stashed in `metadata.payload_id`
 * as a Supabase row (Stripe metadata caps at 500 chars per value, 50 keys total).
 * The webhook reads this row on `checkout.session.completed` to create
 * `event_registrations` rows and send the confirmation email.
 */
export async function createCheckoutSession(
  eventId: string,
  tierId: string,
  attendeeData: AttendeeData,
  additionalFields?: TicketingFieldDraft[],
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Resolve tier → Stripe price id
  const { data: tier, error: tierErr } = await supabaseAdmin
    .from("event_ticket_tiers")
    .select("id, name, price, stripe_price_id")
    .eq("id", tierId)
    .single();
  if (tierErr || !tier) {
    throw new Error("Ticket tier not found");
  }
  if (!tier.stripe_price_id) {
    throw new Error(
      "This ticket has no Stripe price yet — save the event again to sync.",
    );
  }

  // Stash attendee data + custom fields out-of-band so the webhook can read it
  const { data: payload, error: payloadErr } = await supabaseAdmin
    .from("checkout_payloads")
    .insert({
      event_id: eventId,
      tier_id: tier.id,
      user_id: user?.id ?? null,
      quantity: 1,
      attendee_data: attendeeData,
      custom_fields: additionalFields ?? [],
    })
    .select("id")
    .single();
  if (payloadErr || !payload) {
    console.error("[checkout] payload stash failed:", payloadErr);
    throw new Error("Failed to start checkout");
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [{ price: tier.stripe_price_id, quantity: 1 }],
    success_url: `${SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${SITE_URL}/events/${eventId}/checkout`,
    metadata: {
      event_id: eventId,
      tier_id: tier.id,
      payload_id: payload.id,
      quantity: "1",
    },
  });

  redirect(session.url!);
}
