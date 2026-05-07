import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@c3/supabase/server";
import { supabaseAdmin } from "@c3/supabase/admin";
import { checkEventPermission } from "@c3/supabase/club-admin";
import { stripe } from "@/lib/stripe/serverInstance";

export async function POST(
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
    if (!perm.isCreator && !perm.isClubAdmin) {
      return NextResponse.json(
        { error: "Only the event creator or club admin can trigger payouts" },
        { status: 403 },
      );
    }

    const { data: event } = await supabaseAdmin
      .from("events")
      .select("creator_profile_id")
      .eq("id", eventId)
      .single();

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { data: splits } = await supabaseAdmin
      .from("event_payout_splits")
      .select("club_id, percentage")
      .eq("event_id", eventId);

    if (splits && splits.length > 0) {
      const { data: agreements } = await supabaseAdmin
        .from("event_payout_split_agreements")
        .select("club_id, split_snapshot")
        .eq("event_id", eventId);

      const currentSplitSnapshot = splits.map((s) => ({
        club_id: s.club_id,
        percentage: Number(s.percentage),
      }));

      const allAgreed =
        agreements &&
        agreements.length === splits.length &&
        agreements.every((a) => {
          const aSnap = (a.split_snapshot as { club_id: string; percentage: number }[]) ?? [];
          if (aSnap.length !== currentSplitSnapshot.length) return false;
          return currentSplitSnapshot.every(
            (s) =>
              aSnap.find(
                (as) => as.club_id === s.club_id && as.percentage === s.percentage,
              ),
          );
        });

      if (!allAgreed) {
        return NextResponse.json(
          { error: "All parties must agree on splits before payout can be triggered" },
          { status: 400 },
        );
      }
    }

    const { data: unsettled, error: regErr } = await supabaseAdmin
      .from("event_registrations")
      .select("id, stripe_session_id, amount_total")
      .eq("event_id", eventId)
      .eq("type", "ticket")
      .eq("payout_settled", false);

    if (regErr) {
      console.error("[payout] query error:", regErr);
      return NextResponse.json(
        { error: "Failed to query registrations" },
        { status: 500 },
      );
    }

    if (!unsettled || unsettled.length === 0) {
      return NextResponse.json(
        { error: "No unsettled registrations to pay out" },
        { status: 400 },
      );
    }

    let resolvedSplits: { club_id: string; percentage: number; stripe_account_id: string }[];

    if (splits && splits.length > 0) {
      const clubIds = splits.map((s) => s.club_id);
      const { data: stripeRows } = await supabaseAdmin
        .from("club_stripe_accounts")
        .select("club_id, stripe_account_id, charges_enabled")
        .in("club_id", clubIds);

      const stripeByClub = new Map(
        (stripeRows ?? []).map((r) => [r.club_id, r]),
      );

      for (const s of splits) {
        const stripe = stripeByClub.get(s.club_id);
        if (!stripe?.stripe_account_id || !stripe?.charges_enabled) {
          return NextResponse.json(
            {
              error: `Club in split has not completed Stripe onboarding`,
            },
            { status: 400 },
          );
        }
      }
      resolvedSplits = splits.map((s) => ({
        club_id: s.club_id,
        percentage: Number(s.percentage),
        stripe_account_id: stripeByClub.get(s.club_id)!.stripe_account_id,
      }));
    } else {
      const { data: stripe } = await supabaseAdmin
        .from("club_stripe_accounts")
        .select("stripe_account_id, charges_enabled")
        .eq("club_id", event.creator_profile_id)
        .maybeSingle();

      if (!stripe?.stripe_account_id || !stripe?.charges_enabled) {
        return NextResponse.json(
          { error: "Event creator has not completed Stripe onboarding" },
          { status: 400 },
        );
      }

      resolvedSplits = [
        {
          club_id: event.creator_profile_id,
          percentage: 100,
          stripe_account_id: stripe.stripe_account_id,
        },
      ];
    }

    const sum = resolvedSplits.reduce((s, sp) => s + sp.percentage, 0);
    if (Math.abs(sum - 100) > 0.01) {
      return NextResponse.json(
        { error: "Split percentages must sum to 100" },
        { status: 400 },
      );
    }

    let totalGross = 0;
    let totalFees = 0;
    const chargeFees: Map<string, number> = new Map();

    for (const reg of unsettled) {
      if (!reg.stripe_session_id) continue;

      let paymentIntentId: string | null = null;

      try {
        const session = await stripe.checkout.sessions.retrieve(reg.stripe_session_id);
        paymentIntentId =
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null;
      } catch {
        continue;
      }

      if (paymentIntentId) {
        try {
          const chargeList = await stripe.charges.list({
            payment_intent: paymentIntentId,
            limit: 1,
          });

          const charge = chargeList.data[0];
          if (charge?.balance_transaction) {
            const bt =
              typeof charge.balance_transaction === "string"
                ? await stripe.balanceTransactions.retrieve(charge.balance_transaction)
                : charge.balance_transaction;

            const fee = typeof bt.fee === "number" ? bt.fee : 0;
            chargeFees.set(reg.id, fee);
            totalFees += fee;
          }
        } catch {
          chargeFees.set(reg.id, Math.round((reg.amount_total ?? 0) * 0.0175 + 30));
          totalFees += Math.round((reg.amount_total ?? 0) * 0.0175 + 30);
        }
      }

      totalGross += reg.amount_total ?? 0;
    }

    const netAmount = totalGross - totalFees;

    if (netAmount <= 0) {
      return NextResponse.json(
        { error: "Net amount is zero or negative after fees" },
        { status: 400 },
      );
    }

    const transfers: { club_id: string; amount: number; stripe_account_id: string }[] = [];
    let allocated = 0;

    for (let i = 0; i < resolvedSplits.length; i++) {
      const split = resolvedSplits[i]!;
      const isLast = i === resolvedSplits.length - 1;
      const amount = isLast
        ? netAmount - allocated
        : Math.floor(netAmount * (split.percentage / 100));

      if (amount > 0) {
        transfers.push({
          club_id: split.club_id,
          amount,
          stripe_account_id: split.stripe_account_id,
        });
        allocated += amount;
      }
    }

    const now = new Date().toISOString();
    for (const transfer of transfers) {
      try {
        await stripe.transfers.create(
          {
            amount: transfer.amount,
            currency: "aud",
            destination: transfer.stripe_account_id,
            transfer_group: eventId,
            metadata: {
              event_id: eventId,
              club_id: transfer.club_id,
            },
          },
          {
            idempotencyKey: `${eventId}-${transfer.club_id}`,
          },
        );
      } catch (err) {
        console.error(`[payout] transfer failed for club ${transfer.club_id}:`, err);
        return NextResponse.json(
          {
            error: `Transfer to club ${transfer.club_id} failed: ${err instanceof Error ? err.message : "Unknown error"}`,
          },
          { status: 500 },
        );
      }
    }

    const unsettledIds = unsettled.map((r) => r.id);
    const { error: updateErr } = await supabaseAdmin
      .from("event_registrations")
      .update({
        payout_settled: true,
        payout_settled_at: now,
      })
      .in("id", unsettledIds);

    if (updateErr) {
      console.error("[payout] update error:", updateErr);
    }

    return NextResponse.json({
      data: {
        gross: totalGross,
        fees: totalFees,
        net: netAmount,
        transfers: transfers.map((t) => ({
          club_id: t.club_id,
          amount: t.amount,
        })),
        registrations_settled: unsettledIds.length,
      },
    });
  } catch (error) {
    console.error("POST /api/admin/events/[id]/payout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
