-- Remove the ghost adaptationEvaluator cron schedule.
--
-- Migration 20260719201210 documented a pg_cron job ('adaptation-evaluator-15min')
-- that POSTs to /functions/v1/adaptationEvaluator every 15 minutes, but that
-- edge function was never built (no supabase/functions/adaptationEvaluator).
-- The schedule itself lived only in a comment, to be applied by hand. If anyone
-- ever applied it, every run is a 404 against the functions gateway.
--
-- This unschedules any such job (by name, or by a command that targets the
-- function) and is a no-op when none exists — which was the case in
-- production when this was written (cron.job held only run-automations-hourly,
-- checkin-reminders-friday and weekly-digest-monday). Do NOT re-apply the
-- schedule from 20260719201210 unless an adaptationEvaluator function is
-- deployed first.
--
-- Safe on databases without pg_cron (local rehearsal): skipped.
do $$
declare
  j record;
begin
  if to_regclass('cron.job') is null then
    raise notice 'pg_cron not installed; nothing to unschedule';
    return;
  end if;
  for j in
    execute $q$
      select jobid, jobname from cron.job
       where jobname = 'adaptation-evaluator-15min'
          or command ilike '%/functions/v1/adaptationEvaluator%'
    $q$
  loop
    perform cron.unschedule(j.jobid);
    raise notice 'unscheduled cron job % (%)', j.jobid, j.jobname;
  end loop;
end $$;
