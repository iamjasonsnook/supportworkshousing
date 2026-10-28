// Stripe's rate for SupportWorks Housing, the same one the accounting email
// uses to estimate payouts.
export const STRIPE_PERCENT = 0.022;
export const STRIPE_FIXED = 0.30;

// What a donor adds so the charity receives their whole gift. The fee is
// charged on the total, so the addition has to cover the fee on itself:
// total = (gift + fixed) / (1 - percent). $100 -> $2.56.
export function coverFeeFor(gift) {
  const g = Number(gift);
  if (!Number.isFinite(g) || g <= 0) return 0;
  const total = (g + STRIPE_FIXED) / (1 - STRIPE_PERCENT);
  return Math.round((total - g) * 100) / 100;
}

// "$100" for whole dollars, "$102.56" otherwise.
export const money = n => (Number.isInteger(n) ? String(n) : Number(n).toFixed(2));
