import { stripe } from "./serverInstance";
import { supabaseAdmin } from "@c3/supabase/admin";

export interface TierForSync {
  id?: string;
  name: string;
  price: number;
}

interface ExistingTierRow {
  id: string;
  name: string;
  price: number;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
}

const CURRENCY = "aud";

export async function syncTierStripeProducts(
  eventId: string,
  eventName: string,
  tiers: TierForSync[],
): Promise<void> {
  if (!process.env.STRIPE_SECRET_KEY) return;

  const ids = tiers.map((t) => t.id).filter((x): x is string => !!x);
  const { data: existing } = ids.length
    ? await supabaseAdmin
        .from("event_ticket_tiers")
        .select("id, name, price, stripe_product_id, stripe_price_id")
        .in("id", ids)
    : { data: [] as ExistingTierRow[] };

  const byId = new Map<string, ExistingTierRow>(
    (existing ?? []).map((r) => [r.id, r as ExistingTierRow]),
  );

  for (const tier of tiers) {
    if (!tier.id) continue;
    const row = byId.get(tier.id);
    if (!row) continue;

    const productName = `${eventName || "Event"} — ${tier.name}`;

    if (tier.price <= 0) {
      if (row.stripe_product_id) {
        try {
          await stripe.products.update(row.stripe_product_id, {
            active: false,
          });
        } catch (err) {
          console.error("[stripe] archive product failed:", err);
        }
        await supabaseAdmin
          .from("event_ticket_tiers")
          .update({ stripe_product_id: null, stripe_price_id: null })
          .eq("id", tier.id);
      }
      continue;
    }

    let productId = row.stripe_product_id;
    let priceId = row.stripe_price_id;

    if (!productId) {
      const product = await stripe.products.create({
        name: productName,
        metadata: { event_id: eventId, tier_id: tier.id },
      });
      productId = product.id;
    } else if (row.name !== tier.name) {
      try {
        await stripe.products.update(productId, { name: productName });
      } catch (err) {
        console.error("[stripe] product update failed:", err);
      }
    }

    const priceChanged = !priceId || row.price !== tier.price;
    if (priceChanged) {
      const newPrice = await stripe.prices.create({
        product: productId,
        unit_amount: Math.round(tier.price * 100),
        currency: CURRENCY,
        metadata: { event_id: eventId, tier_id: tier.id },
      });
      try {
        await stripe.products.update(productId, {
          default_price: newPrice.id,
        });
      } catch (err) {
        console.error("[stripe] set default_price failed:", err);
      }
      if (priceId && priceId !== newPrice.id) {
        try {
          await stripe.prices.update(priceId, { active: false });
        } catch (err) {
          console.error("[stripe] archive old price failed:", err);
        }
      }
      priceId = newPrice.id;
    }

    if (
      productId !== row.stripe_product_id ||
      priceId !== row.stripe_price_id
    ) {
      await supabaseAdmin
        .from("event_ticket_tiers")
        .update({
          stripe_product_id: productId,
          stripe_price_id: priceId,
        })
        .eq("id", tier.id);
    }
  }
}
