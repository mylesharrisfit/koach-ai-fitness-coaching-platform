-- Weekly digest send ledger: one row per (coach, week).
--
-- The weekly-digest-monday cron sweep emailed every coach on every invocation,
-- so a retried or overlapping run (pg_net retry, a manual re-run after a
-- timeout, two sweeps racing) re-sent the digest to everyone.
--
-- weeklyDigest now CLAIMS (coach_id, week_of) before emailing and records the
-- outcome afterwards:
--   no row                       -> claim (status 'sending') and send
--   'sent'                       -> skip, already delivered this week
--   'failed'                     -> re-claim and retry
--   'sending' older than 1 hour  -> re-claim (the run that held it died)
--   'sending' newer than 1 hour  -> skip (another run is sending right now)
-- The claim is a single INSERT ... ON CONFLICT DO UPDATE ... WHERE, so
-- concurrent sweeps can't both win the same coach.
--
-- week_of is the Monday (UTC) of the digest week, computed by the caller.
-- Service-role only: RLS on with no policies, functions executable by
-- service_role only.

create table if not exists public.weekly_digest_sends (
  coach_id   uuid not null references public.profiles (id) on delete cascade,
  week_of    date not null,
  status     text not null check (status in ('sending', 'sent', 'failed')),
  attempts   integer not null default 1,
  claimed_at timestamptz not null default now(),
  sent_at    timestamptz,
  last_error text,
  primary key (coach_id, week_of)
);

alter table public.weekly_digest_sends enable row level security;
revoke all on public.weekly_digest_sends from public, anon, authenticated;
grant all on public.weekly_digest_sends to service_role;

create or replace function public.claim_weekly_digest(p_coach uuid, p_week_of date)
 returns boolean
 language plpgsql
 security definer
 set search_path to ''
as $$
begin
  insert into public.weekly_digest_sends as s (coach_id, week_of, status)
  values (p_coach, p_week_of, 'sending')
  on conflict (coach_id, week_of) do update
     set status = 'sending', attempts = s.attempts + 1, claimed_at = now(), last_error = null
   where s.status = 'failed'
      or (s.status = 'sending' and s.claimed_at < now() - interval '1 hour');
  return found;
end;
$$;

create or replace function public.finish_weekly_digest(p_coach uuid, p_week_of date, p_sent boolean, p_error text default null)
 returns void
 language sql
 security definer
 set search_path to ''
as $$
  update public.weekly_digest_sends
     set status = case when p_sent then 'sent' else 'failed' end,
         sent_at = case when p_sent then now() else null end,
         last_error = case when p_sent then null else left(p_error, 500) end
   where coach_id = p_coach and week_of = p_week_of and status = 'sending';
$$;

revoke all on function public.claim_weekly_digest(uuid, date) from public, anon, authenticated;
revoke all on function public.finish_weekly_digest(uuid, date, boolean, text) from public, anon, authenticated;
grant execute on function public.claim_weekly_digest(uuid, date) to service_role;
grant execute on function public.finish_weekly_digest(uuid, date, boolean, text) to service_role;
