import { supabaseAdmin } from "@c3/supabase/admin";

/**
 * Claims all guest (user_id = null) registrations and tickets that were
 * submitted under a given email address, linking them to an authenticated
 * user account.
 *
 * Call this after a user signs up or logs in. Connect3 can POST to
 * `POST /api/registrations/claim` on the ticketing service, or any server
 * action that runs in the same process can call this directly.
 *
 * @returns The number of rows claimed.
 */
export async function claimGuestRegistrations(
  userId: string,
  email: string,
): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from("event_registrations")
    .update({ user_id: userId })
    .is("user_id", null)
    .eq("email", email.toLowerCase())
    .select("id");

  if (error) {
    console.error("[claimGuestRegistrations] failed:", error.message);
    throw new Error("Failed to claim guest registrations");
  }

  return data?.length ?? 0;
}
