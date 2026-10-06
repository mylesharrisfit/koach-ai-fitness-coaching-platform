-- Server-side daily cap for the AI features that do NOT count against the
-- monthly generation allowance (claudeAssistant, aiMessageAssistant,
-- ai*Insights, aiInBodyScan, mapImportColumns, checkin.analyze, ...).
--
-- Those calls were limited only by the plan's feature flag, so a single tenant
-- (or a script holding a coach's session) could run them without bound. One
-- row per paying profile per UTC day; meter_ai_daily() checks + increments in
-- ONE statement (same pattern as meter_ai_generation, migration
-- 20261002000300), so concurrent callers can't overshoot the cap.
--
-- The cap value lives in the edge code (AI_DAILY_CALL_CAP in
-- supabase/functions/_shared/aiPolicy.js); this function only enforces what it
-- is given. p_limit < 0 means uncapped.
--
-- Service-role only: RLS on with no policies, EXECUTE granted to service_role.
-- Coaches cannot read, reset or forge their own counter.

create table if not exists public.ai_daily_usage (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  day        date not null,
  calls      integer not null default 0,
  primary key (profile_id, day)
);

alter table public.ai_daily_usage enable row level security;
revoke all on public.ai_daily_usage from public, anon, authenticated;
grant all on public.ai_daily_usage to service_role;

create or replace function public.meter_ai_daily(p_profile uuid, p_limit integer, p_day date)
 returns table (allowed boolean, used integer)
 language plpgsql
 security definer
 set search_path to ''
as $$
declare
  v_used integer;
begin
  if p_limit = 0 then
    -- the INSERT branch below would otherwise let the first call of a day through
    return query select false, 0;
    return;
  end if;

  insert into public.ai_daily_usage as u (profile_id, day, calls)
  values (p_profile, p_day, 1)
  on conflict (profile_id, day) do update
     set calls = u.calls + 1
   where p_limit < 0 or u.calls < p_limit
  returning u.calls into v_used;

  if found then
    return query select true, v_used;
    return;
  end if;

  select u.calls into v_used from public.ai_daily_usage u
   where u.profile_id = p_profile and u.day = p_day;
  return query select false, coalesce(v_used, 0);
end;
$$;

revoke all on function public.meter_ai_daily(uuid, integer, date) from public, anon, authenticated;
grant execute on function public.meter_ai_daily(uuid, integer, date) to service_role;
