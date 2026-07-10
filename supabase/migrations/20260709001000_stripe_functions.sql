-- ============================================================================
-- Migration 10 (Step 5a) — Stripe function support.
--
-- 1. processed_stripe_events — webhook idempotency ledger. Base44's
--    stripeWebhook verified the signature but had NO idempotency guard, so a
--    redelivered event (Stripe delivers "at least once") could double-process
--    (double-provision a subscription, double-mark a payment paid, resend a
--    receipt email). This table closes that gap: the webhook claims event.id
--    here BEFORE processing; the PK makes the claim atomic and race-safe.
-- 2. profiles.billing_cycle — written by stripeCheckout via updateMe in the
--    Base44 version but never declared in the schema (User was schemaless).
-- ============================================================================

-- --- 1. webhook idempotency ledger ------------------------------------------
create table public.processed_stripe_events (
  event_id text primary key,               -- Stripe event.id (evt_...)
  event_type text,
  processed_at timestamptz not null default now()
);

alter table public.processed_stripe_events enable row level security;
-- Service role (the webhook) bypasses RLS. No authenticated/anon write path.
-- Admins may read the ledger for debugging; nobody else sees it (default-deny).
create policy "select admin" on public.processed_stripe_events
  for select to authenticated using (app.is_admin());

-- --- 2. profiles.billing_cycle ----------------------------------------------
alter table public.profiles
  add column billing_cycle text not null default 'monthly'
    check (billing_cycle in ('monthly', 'annual'));
