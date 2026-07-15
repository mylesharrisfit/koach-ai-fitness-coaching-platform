-- ============================================================================
-- Migration 13 (Step 5e) — support tables for the final function tranche.
--
-- 1. push_subscriptions — Base44's savePushSubscription stored ONLY the
--    endpoint + a timestamp as a JSON string on the user (lossy: the p256dh/
--    auth keys a Web-Push sender needs were thrown away), and its duplicate
--    storePushSubscription stored NOTHING (console.log only). Reconciled to
--    one real table: full subscription JSON per device, so a future send-side
--    can actually deliver. Both function names stay deployed (the frontend
--    calls both) and write here.
--
-- 2. coach_settings Google OAuth columns — Base44's googleCalendarProxy read
--    tokens from its managed platform connector (`connectors.getConnection`),
--    infrastructure that does not exist on Supabase. The port stores each
--    coach's OAuth tokens on their own coach_settings row (RLS: own-scoped);
--    the proxy refreshes via GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET when
--    expired. The consent flow that POPULATES these columns is a frontend
--    OAuth redirect still to be wired — documented in AUTOMATION_MIGRATION.md.
-- ============================================================================

-- --- 1. push_subscriptions ---------------------------------------------------
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null,
  subscription jsonb not null,           -- full PushSubscription JSON (endpoint + keys)
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;
select app.add_updated_at_trigger('public.push_subscriptions');
-- one row per device endpoint per user; re-subscribing updates in place
create unique index push_subscriptions_user_endpoint_key
  on public.push_subscriptions (user_id, endpoint);

create policy "select own or admin" on public.push_subscriptions
  for select to authenticated
  using (user_id = (select auth.uid()) or app.is_admin());
create policy "insert own" on public.push_subscriptions
  for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "update own" on public.push_subscriptions
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "delete own or admin" on public.push_subscriptions
  for delete to authenticated
  using (user_id = (select auth.uid()) or app.is_admin());

-- --- 2. coach_settings: Google OAuth tokens ----------------------------------
alter table public.coach_settings
  add column google_access_token text,
  add column google_refresh_token text,
  add column google_token_expires_at timestamptz;
