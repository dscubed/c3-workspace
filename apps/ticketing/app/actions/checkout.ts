"use server";

import Stripe from "stripe";
import { redirect } from "next/navigation";
import { createClient } from "@c3/supabase/server";
import { AttendeeData } from "@c3/types";
import { TicketingFieldDraft } from "@/lib/types/ticketing";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Server action to create a Stripe checkout session
 * @param priceId
 * @returns
 */
export async function createCheckoutSession(
  eventId: string,
  priceId: string,
  attendeeData: AttendeeData,
  additionalFields?: TicketingFieldDraft[],
  quantity?: number,
) {
  // Perhaps change price id to support creating checkout session for multiple items
  // Unless we want to enforce buy one ticket at a time and not have a cart system

  // Attempt to get authenticated user
  // If the user is not authenticated treat them as a guest
  // and skip all any stuff with membership points or logging transactions
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) {
    console.log("Not authenticated");
  }

  // Serialize attendee data and custom fields into metadata so the webhook
  // can use them for writing to the db and creating receipt email
  const attendeeJson = JSON.stringify(attendeeData);
  const fieldsJson = JSON.stringify(additionalFields ?? []);

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price: priceId,
        quantity: quantity,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/events/success?session_id={CHECKOUT_SESSION_ID}&event_id=${eventId}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/events/cancel?event_id=${eventId}`,
    metadata: {
      event_id: eventId,
      user_id: user?.id ?? "",
      attendee_data: attendeeJson,
      custom_fields: fieldsJson,
    },
  });

  // Redirect to Stripe's checkout page
  redirect(checkoutSession.url!);
}
