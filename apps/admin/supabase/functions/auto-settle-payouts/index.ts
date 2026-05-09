import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!);

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function getSettlementDeadline(end: string | null, start: string | null): Date | null {
  const base = end ?? start;
  if (!base) return null;
  return new Date(new Date(base).getTime() + 14 * 24 * 60 * 60 * 1000);
}

interface SplitParty {
  club_id: string;
  percentage: number;
  stripe_account_id: string | null;
  charges_enabled: boolean;
}

Deno.serve(async (_req: Request) => {
  try {
    console.log("[auto-settle] Starting daily auto-settlement check");

    const { data: events, error: eventsErr } = await supabaseAdmin.rpc(
      "get_events_past_settlement_deadline",
    );

    if (eventsErr) {
      console.error("[auto-settle] RPC error:", eventsErr);

      const { data: rawEvents, error: rawErr } = await supabaseAdmin
        .from("event_summary")
        .select("id, creator_profile_id, start, end");

      if (rawErr) {
        console.error("[auto-settle] fallback query error:", rawErr);
        return new Response(JSON.stringify({ error: rawErr.message }), { status: 500 });
      }

      for (const ev of (rawEvents ?? [])) {
        const deadline = getSettlementDeadline(ev.end, ev.start);
        if (!deadline || deadline >= new Date()) continue;

        const { data: hasUnsettled } = await supabaseAdmin
          .from("event_registrations")
          .select("id")
          .eq("event_id", ev.id)
          .eq("type", "ticket")
          .eq("payout_settled", false)
          .limit(1);

        if (!hasUnsettled || hasUnsettled.length === 0) continue;

        const { data: alreadySettled } = await supabaseAdmin
          .from("event_payout_auto_settled")
          .select("id")
          .eq("event_id", ev.id)
          .limit(1);

        if (alreadySettled && alreadySettled.length > 0) continue;

        await processAutoSettlement(ev.id, ev.creator_profile_id);
      }
    } else {
      for (const ev of (events ?? [])) {
        await processAutoSettlement(ev.id, ev.creator_profile_id ?? ev.creator_id);
      }
    }

    return new Response(JSON.stringify({ status: "complete" }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[auto-settle] fatal error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500 },
    );
  }
});

async function processAutoSettlement(eventId: string, creatorProfileId: string) {
  console.log(`[auto-settle] Processing event ${eventId}`);

  const { data: unsettled } = await supabaseAdmin
    .from("event_registrations")
    .select("id, stripe_session_id, amount_total")
    .eq("event_id", eventId)
    .eq("type", "ticket")
    .eq("payout_settled", false);

  if (!unsettled || unsettled.length === 0) {
    console.log(`[auto-settle] ${eventId}: No unsettled registrations`);
    return;
  }

  const { data: collaborators } = await supabaseAdmin
    .from("event_hosts")
    .select("profile_id")
    .eq("event_id", eventId)
    .eq("status", "accepted");

  const partyIds = [
    creatorProfileId,
    ...((collaborators ?? []).map((c) => c.profile_id)),
  ];

  const uniquePartyIds = [...new Set(partyIds)];

  const { data: stripeRows } = await supabaseAdmin
    .from("club_stripe_accounts")
    .select("club_id, stripe_account_id, charges_enabled")
    .in("club_id", uniquePartyIds);

  const stripeMap = new Map(
    (stripeRows ?? []).map((r) => [r.club_id, r]),
  );

  const parties: SplitParty[] = uniquePartyIds.map((id) => {
    const s = stripeMap.get(id);
    return {
      club_id: id,
      percentage: 0,
      stripe_account_id: s?.stripe_account_id ?? null,
      charges_enabled: s?.charges_enabled ?? false,
    };
  });

  const connectedParties = parties.filter((p) => p.stripe_account_id && p.charges_enabled);

  const connectedIds = new Set(connectedParties.map((p) => p.club_id));
  const creatorConnected = connectedIds.has(creatorProfileId);

  let resolvedSplits: { club_id: string; percentage: number; stripe_account_id: string }[];
  let status: string;
  let fallbackReason: string | null = null;

  if (connectedParties.length === 0) {
    status = "failed";
    fallbackReason = "No parties have connected Stripe accounts";
    resolvedSplits = [];
  } else if (parties.length > 0 && parties.every((p) => connectedIds.has(p.club_id))) {
    status = "success";
    const n = connectedParties.length;
    const base = Math.floor(100 / n);
    const remainder = 100 - base * n;

    resolvedSplits = connectedParties.map((p, i) => ({
      club_id: p.club_id,
      percentage: i === 0 ? base + remainder : base,
      stripe_account_id: p.stripe_account_id!,
    }));
  } else if (creatorConnected) {
    status = "creator_fallback";
    fallbackReason = `Not all parties connected — paying 100% to creator. Connected: ${connectedParties.map((p) => p.club_id).join(", ")}`;
    const creator = connectedParties.find((p) => p.club_id === creatorProfileId)!;
    resolvedSplits = [{
      club_id: creator.club_id,
      percentage: 100,
      stripe_account_id: creator.stripe_account_id!,
    }];
  } else {
    status = "failed";
    fallbackReason = "Creator has no connected Stripe account and not all parties are connected";
    resolvedSplits = [];
  }

  const snapshot = status === "failed" ? [] : resolvedSplits.map((s) => ({
    club_id: s.club_id,
    percentage: s.percentage,
  }));

  await supabaseAdmin
    .from("event_payout_auto_settled")
    .upsert({
      event_id: eventId,
      triggered_at: new Date().toISOString(),
      split_snapshot: snapshot,
      status,
      fallback_reason: fallbackReason,
    }, { onConflict: "event_id" });

  if (status === "failed") {
    console.log(`[auto-settle] ${eventId}: Auto-settlement failed — ${fallbackReason}`);
    return;
  }

  let totalGross = 0;
  let totalFees = 0;

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
          totalFees += typeof bt.fee === "number" ? bt.fee : 0;
        }
      } catch {
        totalFees += Math.round((reg.amount_total ?? 0) * 0.0175 + 30);
      }
    }
    totalGross += reg.amount_total ?? 0;
  }

  const netAmount = totalGross - totalFees;
  if (netAmount <= 0) {
    console.log(`[auto-settle] ${eventId}: Net amount zero or negative`);
    await supabaseAdmin
      .from("event_payout_auto_settled")
      .update({ status: "failed", fallback_reason: "Net amount is zero or negative after fees" })
      .eq("event_id", eventId);
    return;
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
      await stripe.transfers.create({
        amount: transfer.amount,
        currency: "aud",
        destination: transfer.stripe_account_id,
        transfer_group: eventId,
        metadata: {
          event_id: eventId,
          club_id: transfer.club_id,
          auto_settled: "true",
        },
      }, {
        idempotencyKey: `${eventId}-${transfer.club_id}-auto`,
      });
    } catch (err) {
      console.error(`[auto-settle] Transfer failed for club ${transfer.club_id}:`, err);
      return;
    }
  }

  const unsettledIds = unsettled.map((r) => r.id);
  await supabaseAdmin
    .from("event_registrations")
    .update({
      payout_settled: true,
      payout_settled_at: now,
    })
    .in("id", unsettledIds);

  console.log(
    `[auto-settle] ${eventId}: Paid ${transfers.length} parties, net $${(netAmount / 100).toFixed(2)}, status: ${status}`,
  );
}
