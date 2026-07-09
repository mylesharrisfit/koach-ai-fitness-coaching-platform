-- ============================================================================
-- Migration 9 (Step 4.2) — automation runner support.
--
-- 1. Extend automation_logs so it can record EVERY evaluation (fired or not),
--    not just fires (the original browser engine only logged fires).
-- 2. Schedule the runAutomations edge function via pg_cron + pg_net.
--
-- CHOICE (documented in AUTOMATION_MIGRATION.md): the runner is an EDGE
-- FUNCTION invoked by pg_cron, NOT a pure plpgsql pg_cron job. Rationale:
-- the rule semantics (date-fns windows, adherence/streak math, both rule
-- shapes) are ported VERBATIM from the existing JS engines; reimplementing
-- them in plpgsql would be a reinterpretation and a fidelity risk. pg_cron
-- gives reliable in-DB scheduling; pg_net.http_post invokes the function.
-- ============================================================================

-- --- 1. automation_logs: log every evaluation -------------------------------
alter table public.automation_logs
  add column fired boolean not null default true,   -- did the rule trigger?
  add column detail text;                            -- human-readable reason

-- Idempotency support: the runner dedups on (rule_id, client_id) within a
-- window by querying triggered_at >= window_start. Index that access path.
create index if not exists automation_logs_rule_client_time_idx
  on public.automation_logs (rule_id, client_id, triggered_at desc);

-- --- 2. Scheduling (pg_cron + pg_net) ---------------------------------------
-- These extensions live in the `extensions` schema on Supabase. Enabling them
-- is idempotent. On local/dev Postgres without them, this block is a no-op so
-- the migration still applies cleanly (the rehearsal invokes the runner logic
-- directly rather than through cron).
do $$
begin
  create extension if not exists pg_cron;
  create extension if not exists pg_net;
exception when others then
  raise notice 'pg_cron/pg_net not available here (%). Scheduling is a no-op; enable in Supabase.', sqlerrm;
end $$;

-- The actual schedule references the project URL + service-role key, which are
-- SECRETS and must not live in a committed migration. Apply this ONCE per
-- environment after deploy (values from the project settings / Vault):
--
--   select cron.schedule(
--     'run-automations-hourly',
--     '0 * * * *',                        -- top of every hour
--     $$
--       select net.http_post(
--         url     := '<SUPABASE_URL>/functions/v1/runAutomations',
--         headers := jsonb_build_object(
--           'Content-Type',  'application/json',
--           'Authorization', 'Bearer <SUPABASE_SERVICE_ROLE_KEY>'
--         ),
--         body    := '{}'::jsonb
--       );
--     $$
--   );
--
-- The runner's own per-window idempotency (AUTOMATION_WINDOW, default 'day')
-- means overlapping/retried invocations never double-fire a (rule, client)
-- pair — so the cron cadence can be tightened without risk.
