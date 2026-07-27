-- ============================================================================
-- Fix: new coach profiles must NOT be entitled by default.
--
-- profiles.billing_status defaulted to 'active'. handle_new_user() inserts only
-- (id, email, full_name), so every brand-new signup inherited billing_status
-- = 'active' — and the app's paywall (AuthGuardedDashboard) treats 'active' as
-- a paid subscriber. Result: a newly signed-up coach was granted full dashboard
-- access without ever completing Stripe checkout, and was never routed into the
-- plan-selection / checkout step.
--
-- New signups now start 'incomplete' (already an allowed value). They stay
-- gated to plan selection until Stripe checkout completes, at which point the
-- stripeWebhook -> syncSubscriptionToUser flips billing_status to the real
-- subscription status ('trialing', 'active', ...). Existing rows are untouched
-- (this only changes the column default for future inserts).
-- ============================================================================

alter table public.profiles
  alter column billing_status set default 'incomplete';
