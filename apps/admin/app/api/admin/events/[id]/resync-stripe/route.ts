import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@c3/supabase/server";
import { supabaseAdmin } from "@c3/supabase/admin";
import { checkEventPermission } from "@c3/supabase/club-admin";
import { syncTierStripeProducts } from "@/lib/stripe/syncTiers";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: eventId } = await params;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: event } = await supabaseAdmin
      .from("event_summary")
      .select("name, creator_profile_id")
      .eq("id", eventId)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const perm = await checkEventPermission(eventId, user.id);
    if (!perm.isCreator && !perm.isCollaborator && !perm.isClubAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: row } = await supabaseAdmin
      .from("club_stripe_accounts")
      .select("charges_enabled")
      .eq("club_id", event.creator_profile_id)
      .maybeSingle();

    if (!row?.charges_enabled) {
      return NextResponse.json(
        { error: "Connect Stripe before syncing products" },
        { status: 400 },
      );
    }

    const { data: tiers } = await supabaseAdmin
      .from("event_ticket_tiers")
      .select("id, name, price")
      .eq("event_id", eventId);

    if (!tiers || tiers.length === 0) {
      return NextResponse.json({ data: { synced: 0 } });
    }

    try {
      await syncTierStripeProducts(
        eventId,
        event.name ?? "Event",
        tiers,
      );
    } catch (err) {
      console.error("[admin resync] failed:", err);
      return NextResponse.json(
        { error: "Sync failed — check server logs" },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: { synced: tiers.length } });
  } catch (error) {
    console.error("POST /api/admin/events/[id]/resync-stripe error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
