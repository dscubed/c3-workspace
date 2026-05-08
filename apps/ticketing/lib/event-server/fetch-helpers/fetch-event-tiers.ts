import { supabaseAdmin } from "@c3/supabase";

export interface TierRow {
  id: string;
  member_verification: boolean;
  name: string;
  price: number;
  quantity: number | null;
  sort_order: number;
  stripe_price_id: string | null;
  offer_start: string | null;
  offer_end: string | null;
  sold?: number;
}

export async function fetchEventTiers(eventId: string): Promise<TierRow[]> {
  const [{ data: tiers }, { data: regCounts }] = await Promise.all([
    supabaseAdmin
      .from("event_ticket_tiers")
      .select("*")
      .eq("event_id", eventId)
      .order("sort_order"),
    supabaseAdmin
      .from("event_registrations")
      .select("tier_id")
      .eq("event_id", eventId)
      .eq("type", "ticket"),
  ]);

  const soldByTier = new Map<string, number>();
  for (const r of regCounts ?? []) {
    if (r.tier_id) {
      soldByTier.set(r.tier_id, (soldByTier.get(r.tier_id) ?? 0) + 1);
    }
  }

  return (tiers ?? []).map((t) => ({ ...t, sold: soldByTier.get(t.id) ?? 0 }));
}
