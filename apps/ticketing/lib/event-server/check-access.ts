import { getClubAdminRow } from "@c3/supabase";
import { fetchEventRow } from "./fetch-helpers/fetch-event-row";
import { fetchEventHosts } from "./fetch-helpers/fetch-event-hosts";

/**
 * Check whether a user has edit access to an event.
 * Uses minimal fetchers — only queries what's needed for the permission check.
 */
export async function checkEventEditAccess(
  eventId: string,
  userId: string | null,
): Promise<
  | { allowed: true }
  | { allowed: false; reason: "not_authenticated" | "not_found" | "forbidden" }
> {
  if (!userId) {
    return { allowed: false, reason: "not_authenticated" };
  }

  const event = await fetchEventRow(eventId);
  if (!event) {
    return { allowed: false, reason: "not_found" };
  }

  if (event.creator_profile_id === userId) {
    return { allowed: true };
  }

  const hosts = await fetchEventHosts(eventId);
  const isHost = hosts.some(
    (h) => h.profile_id === userId && h.status === "accepted",
  );
  if (isHost) {
    return { allowed: true };
  }

  if (event.creator_profile_id) {
    const adminRow = await getClubAdminRow(event.creator_profile_id, userId);
    if (adminRow) return { allowed: true };
  }

  const collaboratorIds = hosts
    .filter((h) => h.status === "accepted")
    .map((h) => h.profile_id);
  for (const collabId of collaboratorIds) {
    const adminRow = await getClubAdminRow(collabId, userId);
    if (adminRow) return { allowed: true };
  }

  return { allowed: false, reason: "forbidden" };
}
