"use server";

import Stripe from "stripe";
import { redirect } from "next/navigation";
import { createClient } from "@c3/supabase/server";
import { supabaseAdmin } from "@c3/supabase/admin";
import { AttendeeData } from "@c3/types";
import { TicketingFieldDraft } from "@/lib/types/ticketing";
import { calcStripeFeePassthrough } from "@/lib/stripe/fees";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

/**
 * Creates a Stripe Checkout Session for a ticket purchase.
 *
 * Attendee data + custom field answers are stashed in `metadata.payload_id`
 * as a Supabase row (Stripe metadata caps at 500 chars per value, 50 keys total).
 * The webhook reads this row on `checkout.session.completed` to create
 * `event_registrations` rows and send the confirmation email.
 *
 * Returns `{ error: string }` if validation fails. On success, calls redirect()
 * which never returns to the caller.
 */
export async function createCheckoutSession(
  eventId: string,
  tierId: string,
  attendeeData: AttendeeData,
  additionalFields?: TicketingFieldDraft[],
): Promise<{ error: string } | undefined> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Resolve tier → Stripe price id
  const { data: tier, error: tierErr } = await supabaseAdmin
    .from("event_ticket_tiers")
    .select("id, name, price, stripe_price_id, member_verification")
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

  // Enforce member-only tiers server-side
  if (tier.member_verification) {
    if (!user) return { error: "Sign in to purchase a member ticket" };

    const { data: eventRow } = await supabaseAdmin
      .from("events")
      .select("creator_profile_id")
      .eq("id", eventId)
      .single();

    const clubId = eventRow?.creator_profile_id;
    if (!clubId) return { error: "Event club not found" };

    const { data: membership } = await supabaseAdmin
      .from("club_memberships")
      .select("id")
      .eq("user_id", user.id)
      .eq("club_id", clubId)
      .maybeSingle();

    if (!membership) {
      return { error: "This ticket is for members only. Join the club to purchase." };
    }
  }

  // Server-side validation — required preset fields
  const slot = (attendeeData[0] ?? {}) as Record<string, string>;
  const requiredPreset = ["first_name", "last_name", "email", "student_id", "course"] as const;
  for (const key of requiredPreset) {
    if (!String(slot[key] ?? "").trim()) {
      return { error: `${key.replace(/_/g, " ")} is required` };
    }
  }
  if (!["yes", "no"].includes(String(slot.is_member ?? "").toLowerCase())) {
    return { error: "Please answer the membership question" };
  }

  const email = String(slot.email ?? "").toLowerCase().trim();
  if (!email) {
    return { error: "Email is required" };
  }

  // Duplicate check — one email, one registration per event
  const { data: existing } = await supabaseAdmin
    .from("event_registrations")
    .select("id")
    .eq("event_id", eventId)
    .eq("email", email)
    .maybeSingle();
  if (existing) {
    return { error: "This email is already registered for this event" };
  }

  // Server-side validation — custom required fields
  const { data: customFields } = await supabaseAdmin
    .from("event_ticketing_fields")
    .select("id, label, required")
    .eq("event_id", eventId)
    .eq("required", true);
  for (const field of customFields ?? []) {
    if (!String(slot[field.id] ?? "").trim()) {
      return { error: `${field.label} is required` };
    }
  }

  // Compute Stripe fee passthrough
  const tierPriceCents = Math.round(tier.price * 100);
  const feeCents = tierPriceCents > 0 ? calcStripeFeePassthrough(tierPriceCents) : 0;

  // Resolve user_id by typed email — auto-link ticket to whoever owns that email
  const { data: matchedUserId } = await supabaseAdmin.rpc(
    "get_user_id_by_email",
    { p_email: email },
  );

  // Stash attendee data + custom fields out-of-band so the webhook can read it
  const { data: payload, error: payloadErr } = await supabaseAdmin
    .from("checkout_payloads")
    .insert({
      event_id: eventId,
      tier_id: tier.id,
      user_id: (matchedUserId as string | null) ?? null,
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
    line_items: [
      { price: tier.stripe_price_id, quantity: 1 },
      ...(feeCents > 0
        ? [
            {
              price_data: {
                currency: "aud",
                product_data: { name: "Stripe processing fee" },
                unit_amount: feeCents,
              },
              quantity: 1,
            },
          ]
        : []),
    ],
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
