import { supabaseAdmin } from "@c3/supabase/admin";
import { getClubAdminRow } from "@c3/supabase/club-admin";
import { createClient } from "@c3/supabase/server";

export async function requireClubAdmin(clubId: string | null) {
  if (!clubId) return { error: "club_id required", status: 400 } as const;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 } as const;
  if (user.id !== clubId) {
    const adminRow = await getClubAdminRow(clubId, user.id);
    if (!adminRow) return { error: "Forbidden", status: 403 } as const;
  }
  return { user, clubId } as const;
}
