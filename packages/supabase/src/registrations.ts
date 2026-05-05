import { supabaseAdmin } from "./admin";
import type { EventRegistration, RegistrationWithEvent } from "@c3/types";

const REGISTRATION_SELECT = `
  id,
  event_id,
  user_id,
  type,
  email,
  first_name,
  last_name,
  student_id,
  course,
  attendee_data,
  qr_code_id,
  stripe_session_id,
  checked_in,
  checked_in_at,
  created_at
`;

const REGISTRATION_WITH_EVENT_SELECT = `
  ${REGISTRATION_SELECT},
  events(
    name,
    start,
    status,
    event_images(url, sort_order),
    event_venues(venue, type, sort_order)
  )
`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRegistration(row: any): EventRegistration {
  return {
    id: row.id,
    event_id: row.event_id,
    user_id: row.user_id,
    type: row.type,
    email: row.email,
    first_name: row.first_name,
    last_name: row.last_name,
    student_id: row.student_id ?? null,
    course: row.course ?? null,
    custom_fields: row.attendee_data ?? {},
    qr_code_id: row.qr_code_id,
    stripe_session_id: row.stripe_session_id,
    checked_in: row.checked_in,
    checked_in_at: row.checked_in_at,
    created_at: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRegistrationWithEvent(row: any): RegistrationWithEvent {
  const event = row.events as {
    name: string | null;
    start: string | null;
    status: string;
    event_images: { url: string; sort_order: number }[];
    event_venues: { venue: string | null; type: string; sort_order: number }[];
  } | null;

  const images = (event?.event_images ?? []).sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const venues = (event?.event_venues ?? []).sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const primaryVenue =
    venues.find((v) => v.type !== "tba" && v.type !== "online") ?? venues[0];

  return {
    ...toRegistration(row),
    event_name: event?.name ?? null,
    event_start: event?.start ?? null,
    event_status: event?.status ?? null,
    event_thumbnail: images[0]?.url ?? null,
    event_venue: primaryVenue?.venue ?? null,
  };
}

/**
 * Fetch all registrations for a user, joined with event details.
 * Uses service-role client; call only from server-side code.
 */
export async function fetchUserRegistrations(
  userId: string,
): Promise<RegistrationWithEvent[]> {
  const { data, error } = await supabaseAdmin
    .from("event_registrations")
    .select(REGISTRATION_WITH_EVENT_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toRegistrationWithEvent);
}

/**
 * Fetch all registrations for an event.
 * Uses service-role client; call only from server-side code.
 */
export async function fetchEventRegistrations(
  eventId: string,
): Promise<EventRegistration[]> {
  const { data, error } = await supabaseAdmin
    .from("event_registrations")
    .select(REGISTRATION_SELECT)
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toRegistration);
}

/**
 * Fetch only the event IDs a user has active registrations for.
 * Useful for marking events as "Registered" in listings.
 */
export async function fetchUserRegisteredEventIds(
  userId: string,
): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from("event_registrations")
    .select("event_id")
    .eq("user_id", userId);

  if (error) throw error;
  return (data ?? []).map((r) => r.event_id);
}
