-- Server-side paywall for coach writes.
--
-- Until now billing was enforced only in React (BillingGate) and for AI calls.
-- A coach whose trial ended or whose subscription lapsed could keep creating
-- and editing clients, programs, plans, messages, ... by calling PostgREST
-- directly with their session.
--
-- This adds a RESTRICTIVE insert + update policy to the core coaching tables.
-- Restrictive policies are AND-ed with the existing permissive ones, so nothing
-- that is denied today becomes allowed; the only change is that a write must
-- ALSO pass one of:
--   * the caller has billing access (app.coach_has_billing_access: comped /
--     admin / trialing / active / past_due grace / migration trial, or an
--     accepted team member whose team owner has access), or
--   * the caller is the portal client the row belongs to (client-scoped tables
--     only) — clients' own check-ins, logs, messages, payments of invoices
--     are never blocked by their coach's billing state.
-- Reads and deletes are unchanged (a lapsed coach can still see and export
-- their data, and delete clients to get back under a plan cap).
-- Service role (webhooks, cron, edge functions using the service client)
-- bypasses RLS as before.

-- Caller-scoped wrapper: authenticated sessions may ask about THEMSELVES only
-- (coach_has_billing_access(uuid) stays service-role only so nobody can probe
-- another account's billing state).
create or replace function app.caller_has_billing_access()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select auth.uid() is not null and app.coach_has_billing_access(auth.uid());
$$;
revoke all on function app.caller_has_billing_access() from public, anon;
grant execute on function app.caller_has_billing_access() to authenticated, service_role;

-- Batch check for service-role jobs (runAutomations): which of these coaches
-- currently have billing access. Exposed in public so the service client can
-- call it via PostgREST rpc; EXECUTE is service-role only.
create or replace function public.coaches_with_billing_access(p_ids uuid[])
returns table (id uuid)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select u from unnest(p_ids) as u where app.coach_has_billing_access(u);
$$;
revoke all on function public.coaches_with_billing_access(uuid[]) from public, anon, authenticated;
grant execute on function public.coaches_with_billing_access(uuid[]) to service_role;

do $$
declare
  t text;
  -- tables with a client_id: the row's portal client may still write it
  client_scoped text[] := array[
    'messages', 'check_ins', 'coaching_sessions', 'plan_versions', 'weigh_ins',
    'goals', 'habits', 'habit_completions', 'daily_logs', 'food_logs',
    'workout_sessions', 'in_body_scans', 'client_badges', 'invoices',
    'nutrition_plans'
  ];
  -- coach-only tables
  coach_only text[] := array[
    'clients', 'workout_programs', 'check_in_forms', 'automation_rules',
    'meal_templates', 'exercise_library', 'leads'
  ];
  expr text;
begin
  foreach t in array client_scoped || coach_only loop
    expr := case when t = any (client_scoped)
                 then '(select app.caller_has_billing_access()) or app.is_portal_client(client_id)'
                 else '(select app.caller_has_billing_access())' end;
    execute format('drop policy if exists "paywall: insert needs billing access" on public.%I', t);
    execute format('drop policy if exists "paywall: update needs billing access" on public.%I', t);
    execute format(
      'create policy "paywall: insert needs billing access" on public.%I as restrictive for insert to authenticated with check (%s)',
      t, expr);
    execute format(
      'create policy "paywall: update needs billing access" on public.%I as restrictive for update to authenticated using (true) with check (%s)',
      t, expr);
  end loop;
end $$;
