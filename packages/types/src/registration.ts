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
  /** Extra event-specific fields */
  custom_fields: CustomFields;
  qr_code_id: string;
  stripe_session_id: string | null;
  checked_in: boolean;
  checked_in_at: string | null;
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
