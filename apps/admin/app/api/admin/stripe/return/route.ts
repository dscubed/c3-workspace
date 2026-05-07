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
        .from("events")
        .select(
          "id, name, event_ticket_tiers(id, name, price, stripe_product_id)",
        )
        .eq("creator_profile_id", auth.clubId);

      const needsSync = (events ?? []).filter((e) => {
        const tiers = e.event_ticket_tiers as unknown as {
          price: number;
          stripe_product_id: string | null;
        }[];
        return tiers?.some((t) => t.price > 0 && !t.stripe_product_id);
      });

      if (needsSync.length > 0) {
        for (const e of needsSync) {
          const tiers = (e.event_ticket_tiers as unknown as {
            id: string;
            name: string;
            price: number;
          }[]);
          try {
            await syncTierStripeProducts(
              e.id,
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
