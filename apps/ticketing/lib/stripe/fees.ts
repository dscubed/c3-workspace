export const STRIPE_PERCENT = 0.017;
export const STRIPE_FIXED_CENTS = 30;

export function calcStripeFeePassthrough(tierPriceCents: number): number {
  const grossCents = Math.ceil(
    (tierPriceCents + STRIPE_FIXED_CENTS) / (1 - STRIPE_PERCENT),
  );
  return grossCents - tierPriceCents;
}

export function calcFeeDisplay(tierPriceDollars: number): number {
  const FIXED = STRIPE_FIXED_CENTS / 100;
  const gross = (tierPriceDollars + FIXED) / (1 - STRIPE_PERCENT);
  return parseFloat((gross - tierPriceDollars).toFixed(2));
}
