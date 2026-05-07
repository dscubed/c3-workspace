import { supabaseAdmin } from "./admin";

/**
 * Check if a user is an accepted admin for a given club.
 * Returns the admin row if found, null otherwise.
 */
export async function getClubAdminRow(clubId: string, userId: string) {
  const { data, error } = await supabaseAdmin
    .from("club_admins")
    .select("id, club_id, user_id, role, status")
    .eq("club_id", clubId)
    .eq("user_id", userId)
    .eq("status", "accepted")
    .maybeSingle();
  if (error) console.error("[getClubAdminRow] error:", error);
  return data;
}

/**
 * Get all club IDs where the user is an accepted admin, plus the user's own
 * profile if they are an organisation account (i.e. they log in as the club).
 */
export async function getAdminClubIds(userId: string): Promise<string[]> {
  const [{ data: adminRows }, { data: ownProfile }] = await Promise.all([
    supabaseAdmin
      .from("club_admins")
      .select("club_id")
      .eq("user_id", userId)
      .eq("status", "accepted"),
    supabaseAdmin
      .from("profiles")
      .select("id, account_type")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  const ids = new Set((adminRows ?? []).map((r) => r.club_id as string));
  if (ownProfile?.account_type === "organisation") {
    ids.add(userId);
  }
  return [...ids];
}

/**
 * Resolves the effective profile ID for a request.
 * If `requestedProfileId` is provided and the user is an accepted admin of that club,
 * returns it; otherwise falls back to the user's own ID.
 */
export async function resolveManagedProfileId(
  requestedProfileId: string | null | undefined,
  userId: string,
): Promise<string | null> {
  if (!requestedProfileId) return userId;
  if (requestedProfileId === userId) return requestedProfileId;

  const adminRow = await getClubAdminRow(requestedProfileId, userId);
  return adminRow ? requestedProfileId : null;
}

export interface EventPermission {
  isCreator: boolean;
  isCollaborator: boolean;
  isClubAdmin: boolean;
  creatorProfileId: string | null;
}

/**
 * Check if a user has permission to manage an event.
 * Returns whether they are the creator, an accepted collaborator, or an admin
 * of a club that owns or co-hosts the event.
 */
export async function checkEventPermission(
  eventId: string,
  userId: string,
): Promise<EventPermission> {
  const { data: event } = await supabaseAdmin
    .from("events")
    .select("creator_profile_id")
    .eq("id", eventId)
    .single();

  if (!event) {
    return {
      isCreator: false,
      isCollaborator: false,
      isClubAdmin: false,
      creatorProfileId: null,
    };
  }

  const creatorProfileId = event.creator_profile_id as string;
  const isCreator = creatorProfileId === userId;

  if (isCreator) {
    return {
      isCreator: true,
      isCollaborator: false,
      isClubAdmin: false,
      creatorProfileId,
    };
  }

  // Check direct collaborator
  const { data: hostRow } = await supabaseAdmin
    .from("event_hosts")
    .select("status")
    .eq("event_id", eventId)
    .eq("profile_id", userId)
    .eq("status", "accepted")
    .maybeSingle();

  if (hostRow) {
    return {
      isCreator: false,
      isCollaborator: true,
      isClubAdmin: false,
      creatorProfileId,
    };
  }

  // Check club admin for creator org
  if (creatorProfileId) {
    const adminRow = await getClubAdminRow(creatorProfileId, userId);
    if (adminRow) {
      return {
        isCreator: false,
        isCollaborator: false,
        isClubAdmin: true,
        creatorProfileId,
      };
    }
  }

  // Check club admin for any collaborator org
  const { data: allHosts } = await supabaseAdmin
    .from("event_hosts")
    .select("profile_id")
    .eq("event_id", eventId)
    .eq("status", "accepted");

  if (allHosts) {
    for (const host of allHosts) {
      const adminRow = await getClubAdminRow(host.profile_id as string, userId);
      if (adminRow) {
        return {
          isCreator: false,
          isCollaborator: false,
          isClubAdmin: true,
          creatorProfileId,
        };
      }
    }
  }

  return {
    isCreator: false,
    isCollaborator: false,
    isClubAdmin: false,
    creatorProfileId,
  };
}
