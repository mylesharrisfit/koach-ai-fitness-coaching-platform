/**
 * Subscription billing-period helpers (Step 5a follow-up).
 *
 * Stripe API versions ≥ 2025-03-31.basil moved `current_period_end` /
 * `current_period_start` from the Subscription object to each subscription
 * ITEM (`items.data[].current_period_end`). The pinned SDK (stripe@14.21.0 →
 * Stripe-Version 2023-10-16) still returns the top-level field on its own
 * requests, but WEBHOOK event payloads follow the webhook endpoint's
 * configured API version — on a new account that's post-basil, so
 * `event.data.object.current_period_end` is undefined and the verbatim Base44
 * logic (`new Date(undefined * 1000).toISOString()`) would throw on every
 * customer.subscription.* event.
 *
 * These helpers accept BOTH shapes, so the functions are correct under the
 * pinned SDK today and stay correct across endpoint API versions or a future
 * SDK upgrade. Validated against the live (test-mode) account's docs/changelog
 * and rehearsed for both shapes in scripts/verify-stripe-idempotency.mjs.
 */

/** Epoch seconds of the current period end, from either object shape; null if absent. */
export function subscriptionPeriodEnd(subscription) {
  if (!subscription) return null;
  if (subscription.current_period_end != null) return subscription.current_period_end;
  const items = subscription.items?.data;
  if (!Array.isArray(items) || !items.length) return null;
  // A subscription's items share a billing cycle unless explicitly configured
  // otherwise; take the latest period end to be safe with mixed cycles.
  const ends = items.map((it) => it.current_period_end).filter((v) => v != null);
  return ends.length ? Math.max(...ends) : null;
}

/** YYYY-MM-DD renewal date for profiles.subscription_renewal_date; null if unknown. */
export function renewalDateFromSubscription(subscription) {
  const end = subscriptionPeriodEnd(subscription);
  return end != null ? new Date(end * 1000).toISOString().split('T')[0] : null;
}
