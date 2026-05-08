"use server";

import { redirect } from "next/navigation";
import { createClient } from "@c3/supabase/server";
import { supabaseAdmin } from "@c3/supabase/admin";
import { generateQRCodeBuffer, signPayload } from "@/lib/events/qr/qr";
import { sendRegistrationEmail } from "@/lib/events/check-in/sendTicketEmail";
import type { AttendeeData } from "@c3/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";

/**
 * Server action: register a single attendee for a non-ticketed event.
 * Creates an event_registrations row, generates a QR code, and sends
 * the attendance email. Then redirects to /success.
 */
export async function registerForEvent(
  eventId: string,
  attendeeData: AttendeeData,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Flatten the first attendee slot
  const slot = attendeeData[0] ?? {};
  const firstName = slot["first_name"] ?? "";
  const lastName = slot["last_name"] ?? "";
  const email = (slot["email"] ?? user?.email ?? "").toLowerCase();

  if (!email) {
    throw new Error("Email is required to register");
  }

  // Duplicate check — one email, one registration per event
  const { data: existing } = await supabaseAdmin
    .from("event_registrations")
    .select("id")
    .eq("event_id", eventId)
    .eq("email", email)
    .maybeSingle();
  if (existing) {
    throw new Error("This email is already registered for this event");
  }

  // Everything that isn't a core identity field is a custom answer
  const {
    first_name: _fn,
    last_name: _ln,
    email: _em,
    student_id: _sid,
    course: _course,
    ...customFields
  } = slot;

  // Fetch event details for the confirmation email
  const { data: event } = await supabaseAdmin
    .from("events")
    .select("name, event_venues(venue), event_occurrences(start)")
    .eq("id", eventId)
    .single();

  // Resolve user_id by typed email — auto-link ticket to whoever owns that email
  const { data: matchedUserId } = await supabaseAdmin.rpc(
    "get_user_id_by_email",
    { p_email: email },
  );

  const { data: registration, error: insertError } = await supabaseAdmin
    .from("event_registrations")
    .insert({
      event_id: eventId,
      user_id: (matchedUserId as string | null) ?? null,
      type: "registration",
      email,
      first_name: firstName,
      last_name: lastName,
      student_id: (slot["student_id"] as string | undefined) ?? null,
      course: (slot["course"] as string | undefined) ?? null,
      attendee_data: customFields,
    })
    .select("id, qr_code_id")
    .single();

  if (insertError) {
    console.error("[registerForEvent] insert error:", insertError);
  }

  if (insertError || !registration) {
    throw new Error("Failed to create registration");
  }

  const ticketSecret = process.env.TICKET_SECRET;
  if (!ticketSecret) throw new Error("TICKET_SECRET env var is not set");
  const qrPayload = signPayload("ticket", registration.qr_code_id, ticketSecret);
  const qrBuffer = await generateQRCodeBuffer(qrPayload);

  const startTs = event?.event_occurrences?.[0]?.start;
  const eventDate = startTs
    ? new Date(startTs).toLocaleDateString("en-AU", {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : undefined;
  const venues = event?.event_venues as { venue: string | null }[] | null;
  const venueName = venues?.[0]?.venue ?? undefined;

  await sendRegistrationEmail({
    email,
    firstName,
    eventName: event?.name ?? "Event",
    qrBuffer,
    registrationId: registration.id,
    eventDate,
    venueName,
    thumbnailUrl: null,
  });

  redirect(`${SITE_URL}/success?registration_id=${registration.id}`);
}
