/**
 * Plan prices shown in the app. These mirror the live Stripe prices (looked up
 * server-side by lookup_key koach_<plan>_<monthly|yearly>); Stripe is what
 * actually charges, so change a price in Stripe AND here.
 *
 *   Starter $49/mo or $468/yr · Pro $89/mo or $852/yr
 *   Elite $149/mo or $1,428/yr · Enterprise $299/mo or $2,868/yr
 *
 * `annual` is the per-month equivalent of the yearly price (yearly / 12) and
 * `annualSave` the yearly saving vs 12 monthly payments.
 */
const YEARLY = { starter: 468, pro: 852, elite: 1428, enterprise: 2868 };
const MONTHLY = { starter: 49, pro: 89, elite: 149, enterprise: 299 };

export const PLAN_PRICES = Object.fromEntries(
  Object.keys(MONTHLY).map((k) => [k, {
    monthly: MONTHLY[k],
    yearly: YEARLY[k],
    annual: Math.round(YEARLY[k] / 12),
    annualSave: MONTHLY[k] * 12 - YEARLY[k],
  }]),
);

export const formatMoney = (n) => `$${Number(n).toLocaleString('en-US')}`;
