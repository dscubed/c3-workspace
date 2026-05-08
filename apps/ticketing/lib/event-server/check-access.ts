import { getClubAdminRow } from "@c3/supabase";
import { fetchEventRow, type EventRow } from "./fetch-helpers/fetch-event-row";
import { fetchEventHosts, type HostRow } from "./fetch-helpers/fetch-event-hosts";
import { fetchFullEventData } from "./fetchEventServer";
import { publicToFetchedData } from "./transform";
import type { FetchedEventData } from "@/lib/api/fetchEvent";

/* ── Pure permission check (no DB) ── */

async function checkPermission(
  row: EventRow,
  hosts: HostRow[],
  userId: string,
): Promise<"creator" | "host" | "club_admin" | null> {
  if (row.creator_profile_id === userId) return "creator";

  if (hosts.some((h) => h.profile_id === userId && h.status === "accepted")) {
    return "host";
  }

  if (row.creator_profile_id) {
    const adminRow = await getClubAdminRow(row.creator_profile_id, userId);
    if (adminRow) return "club_admin";
  }

  const collaboratorIds = hosts
    .filter((h) => h.status === "accepted")
    .map((h) => h.profile_id);
  for (const collabId of collaboratorIds) {
    const adminRow = await getClubAdminRow(collabId, userId);
    if (adminRow) return "club_admin";
  }

  return null;
}

/* ── Auth gate (minimal fetches, no data transform) ── */

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

  const row = await fetchEventRow(eventId);
  if (!row) {
    return { allowed: false, reason: "not_found" };
  }

  const hosts = await fetchEventHosts(eventId);
  const permission = await checkPermission(row, hosts, userId);
  if (!permission) {
    return { allowed: false, reason: "forbidden" };
  }

  return { allowed: true };
}

/* ── Auth + data (reuses row + hosts from permission check) ── */

export async function fetchEventForEdit(
  eventId: string,
  userId: string | null,
): Promise<
  | { allowed: true; data: FetchedEventData }
  | { allowed: false; reason: "not_authenticated" | "not_found" | "forbidden" }
> {
  if (!userId) {
    return { allowed: false, reason: "not_authenticated" };
  }

  const row = await fetchEventRow(eventId);
  if (!row) {
    return { allowed: false, reason: "not_found" };
  }

  const hosts = await fetchEventHosts(eventId);
  const permission = await checkPermission(row, hosts, userId);
  if (!permission) {
    return { allowed: false, reason: "forbidden" };
  }

  const event = await fetchFullEventData(eventId, { row, hosts });
  const data = publicToFetchedData(event);
  return { allowed: true, data };
}
