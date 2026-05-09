import { supabaseAdmin } from "../admin";

export interface HostRow {
  profile_id: string;
  sort_order: number;
  status: string;
  inviter_id: string | null;
  profiles: {
    id: string;
    first_name: string;
    avatar_url: string | null;
  } | null;
}

export async function fetchEventHosts(eventId: string): Promise<HostRow[]> {
  const { data } = await supabaseAdmin
    .from("event_hosts")
    .select(
      "profile_id, sort_order, status, inviter_id, profiles:profile_id(id, first_name, avatar_url)",
    )
    .eq("event_id", eventId)
    .order("sort_order");

  return (data ?? []) as unknown as HostRow[];
}
