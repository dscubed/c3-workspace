import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@c3/supabase/admin";
import { stripe } from "@/lib/stripe/serverInstance";
import { syncTierStripeProducts } from "@/lib/stripe/syncTiers";
import { requireClubAdmin } from "@/lib/auth/clubGuard";

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3002";

export async function GET(req: NextRequest) {
  try {
    const clubId = req.nextUrl.searchParams.get("club_id");
    const auth = await requireClubAdmin(clubId);
    if ("error" in auth) {
      return NextResponse.redirect(
        `${ADMIN_URL}/dashboard/payment?error=${auth.error}`,
      );
    }

    const { data: row } = await supabaseAdmin
      .from("club_stripe_accounts")
      .select("stripe_account_id, connected_at")
      .eq("club_id", auth.clubId)
      .maybeSingle();

    if (!row?.stripe_account_id) {
      return NextResponse.redirect(
        `${ADMIN_URL}/dashboard/payment?error=no_account`,
      );
    }

    const account = await stripe.accounts.retrieve(row.stripe_account_id);

    const firstTimeConnected = !row.connected_at && account.charges_enabled;

    await supabaseAdmin
      .from("club_stripe_accounts")
      .update({
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled,
        ...(firstTimeConnected
          ? { connected_at: new Date().toISOString() }
          : {}),
      })
      .eq("club_id", auth.clubId);

    if (account.charges_enabled) {
      const { data: events } = await supabaseAdmin
        .from("event_summary")
        .select("id, name")
        .eq("creator_profile_id", auth.clubId);

      const eventIds = (events ?? []).map((e) => e.id!).filter(Boolean);

      const tiersByEvent = new Map<string, { id: string; name: string; price: number; stripe_product_id: string | null }[]>();
      if (eventIds.length > 0) {
        const { data: allTiers } = await supabaseAdmin
          .from("event_ticket_tiers")
          .select("event_id, id, name, price, stripe_product_id")
          .in("event_id", eventIds);

        for (const t of allTiers ?? []) {
          const list = tiersByEvent.get(t.event_id) ?? [];
          list.push(t);
          tiersByEvent.set(t.event_id, list);
        }
      }

      const needsSync = (events ?? []).filter((e) => {
        const tiers = tiersByEvent.get(e.id!) ?? [];
        return tiers.some((t) => t.price > 0 && !t.stripe_product_id);
      });

      if (needsSync.length > 0) {
        for (const e of needsSync) {
          const tiers = tiersByEvent.get(e.id!) ?? [];
          try {
            await syncTierStripeProducts(
              e.id!,
              e.name ?? "Event",
              tiers.map((t) => ({ id: t.id, name: t.name, price: t.price })),
            );
          } catch (err) {
            console.error(
              "[stripe return backfill] sync failed for",
              e.id,
              err,
            );
          }
        }
      }
    }

    return NextResponse.redirect(
      `${ADMIN_URL}/dashboard/payment?onboarding=complete`,
    );
  } catch (error) {
    console.error("[stripe return] error:", error);
    return NextResponse.redirect(`${ADMIN_URL}/dashboard/payment?error=stripe`);
  }
}
