export type RegistrationType = "ticket" | "registration";

/**
 * Core attendee identity — always required, stored as real columns.
 * Applies to both authed users and anonymous attendees.
 */
export interface AttendeeIdentity {
  first_name: string;
  last_name: string;
  email: string;
}

/**
 * Arbitrary key→value pairs from event-specific custom checkout fields.
 * Stored as `custom_fields JSONB` on the registration row.
 */
export type CustomFields = Record<string, string>;

/**
 * Flat shape of a single registration row as returned from the DB.
 */
export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string | null;
  type: RegistrationType;
  /** Core identity — always present */
  email: string;
  first_name: string;
  last_name: string;
  /** Always-present identity columns */
  student_id: string | null;
  course: string | null;
  /** Extra event-specific fields */
  custom_fields: CustomFields;
  qr_code_id: string;
  stripe_session_id: string | null;
  checked_in: boolean;
  checked_in_at: string | null;
  checked_in_by: string | null;
  checked_in_by_name: string | null;
  created_at: string;
}

/**
 * Per-ticket attendee data collected by the checkout form.
 * Index = ticket position (0-based).
 */
export type AttendeeData = Record<
  number,
  Partial<AttendeeIdentity> & CustomFields
>;

/**
 * A registration row joined with its parent event details.
 * Returned by fetchUserRegistrations / fetchEventRegistrations.
 */
export interface RegistrationWithEvent extends EventRegistration {
  event_name: string | null;
  event_start: string | null;
  event_status: string | null;
  event_thumbnail: string | null;
  event_venue: string | null;
}
