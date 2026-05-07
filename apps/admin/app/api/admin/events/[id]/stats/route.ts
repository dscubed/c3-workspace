import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@c3/supabase/server";
import { supabaseAdmin } from "@c3/supabase/admin";
import { checkEventPermission } from "@c3/supabase/club-admin";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: eventId } = await params;

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const perm = await checkEventPermission(eventId, user.id);
    if (!perm.isCreator && !perm.isCollaborator && !perm.isClubAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: event, error: eventErr } = await supabaseAdmin
      .from("events")
      .select("name, start, status, creator_profile_id, event_capacity")
      .eq("id", eventId)
      .single();

    if (eventErr || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { data: regStats, error: regErr } = await supabaseAdmin
      .from("event_registrations")
      .select("tier_id, amount_total, payout_settled")
      .eq("event_id", eventId)
      .eq("type", "ticket");

    if (regErr) {
      return NextResponse.json(
        { error: "Failed to query registrations" },
        { status: 500 },
      );
    }

    const { data: tiers } = await supabaseAdmin
      .from("event_ticket_tiers")
      .select("id, name, price, quantity")
      .eq("event_id", eventId)
      .order("sort_order");

    const byTier = new Map<string, { name: string; capacity: number | null; sold: number; revenue: number; settled: number; unsettled: number }>();
    for (const t of tiers ?? []) {
      byTier.set(t.id, { name: t.name, capacity: t.quantity, sold: 0, revenue: 0, settled: 0, unsettled: 0 });
    }

    let totalSold = 0;
    let totalGross = 0;
    let totalSettled = 0;
    let totalUnsettled = 0;

    for (const r of regStats ?? []) {
      const entry = byTier.get(r.tier_id);
      if (entry) {
        entry.sold++;
        entry.revenue += r.amount_total ?? 0;
        if (r.payout_settled) {
          entry.settled += r.amount_total ?? 0;
        } else {
          entry.unsettled += r.amount_total ?? 0;
        }
      }
      totalSold++;
      totalGross += r.amount_total ?? 0;
      if (r.payout_settled) {
        totalSettled += r.amount_total ?? 0;
      } else {
        totalUnsettled += r.amount_total ?? 0;
      }
    }

    const feePerCharge = 30;
    const estimatedFees = totalSold > 0
      ? Math.round(totalGross * 0.029) + totalSold * feePerCharge
      : 0;
    const estimatedNet = totalGross - estimatedFees;

    const tierBreakdown = Array.from(byTier.entries()).map(([id, data]) => ({
      id,
      ...data,
    }));

    const { data: splits } = await supabaseAdmin
      .from("event_payout_splits")
      .select("id, event_id, club_id, percentage, created_at, profiles(id, first_name, avatar_url)")
      .eq("event_id", eventId);

    const { data: hosts } = await supabaseAdmin
      .from("event_hosts")
      .select("profile_id, status, profiles(id, first_name, avatar_url)")
      .eq("event_id", eventId)
      .eq("status", "accepted");

    const { data: creator } = await supabaseAdmin
      .from("profiles")
      .select("id, first_name, avatar_url")
      .eq("id", event.creator_profile_id)
      .single();

    const allClubIds = [
      ...(creator ? [creator.id] : []),
      ...((hosts ?? []).map((h) => h.profile_id)),
      ...((splits ?? []).map((s) => s.club_id)),
    ];

    const { data: stripeRows } = allClubIds.length > 0
      ? await supabaseAdmin
          .from("club_stripe_accounts")
          .select("club_id, stripe_account_id, charges_enabled")
          .in("club_id", [...new Set(allClubIds)])
      : { data: [] };

    const stripeByClub = new Map(
      (stripeRows ?? []).map((r) => [r.club_id, r]),
    );

    const collaborators: {
      id: string;
      first_name: string | null;
      avatar_url: string | null;
      stripe_account_id: string | null;
      stripe_charges_enabled: boolean;
      is_creator: boolean;
    }[] = [];
    const seenIds = new Set<string>();

    if (creator) {
      const stripe = stripeByClub.get(creator.id);
      seenIds.add(creator.id);
      collaborators.push({
        id: creator.id,
        first_name: creator.first_name,
        avatar_url: creator.avatar_url,
        stripe_account_id: stripe?.stripe_account_id ?? null,
        stripe_charges_enabled: stripe?.charges_enabled ?? false,
        is_creator: true,
      });
    }

    for (const h of hosts ?? []) {
      if (seenIds.has(h.profile_id)) continue;
      seenIds.add(h.profile_id);
      const p = Array.isArray(h.profiles) ? h.profiles[0] : h.profiles;
      const stripe = stripeByClub.get(h.profile_id);
      collaborators.push({
        id: h.profile_id,
        first_name: p?.first_name ?? null,
        avatar_url: p?.avatar_url ?? null,
        stripe_account_id: stripe?.stripe_account_id ?? null,
        stripe_charges_enabled: stripe?.charges_enabled ?? false,
        is_creator: false,
      });
    }

    const { data: lastPayout } = await supabaseAdmin
      .from("event_registrations")
      .select("payout_settled_at")
      .eq("event_id", eventId)
      .eq("payout_settled", true)
      .order("payout_settled_at", { ascending: false })
      .limit(1);

    return NextResponse.json({
      data: {
        event: {
          id: eventId,
          name: event.name,
          start: event.start,
          status: event.status,
          creator_profile_id: event.creator_profile_id,
        },
        current_user_is_creator: event.creator_profile_id === user.id,
        stats: {
          total_sold: totalSold,
          total_gross: totalGross,
          estimated_fees: estimatedFees,
          estimated_net: estimatedNet,
          settled_amount: totalSettled,
          unsettled_amount: totalUnsettled,
          tier_breakdown: tierBreakdown,
        },
        splits: (splits ?? []).map((s) => {
          const p = Array.isArray(s.profiles) ? s.profiles[0] : s.profiles;
          return {
            id: s.id,
            club_id: s.club_id,
            percentage: Number(s.percentage),
            created_at: s.created_at,
            profile: p ? { first_name: p.first_name, avatar_url: p.avatar_url } : null,
          };
        }),
        collaborators,
        last_payout_at: lastPayout?.[0]?.payout_settled_at ?? null,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/events/[id]/stats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
