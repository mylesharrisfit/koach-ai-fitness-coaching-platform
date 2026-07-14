-- ============================================================================
-- Migration 11 (Step 5c) — entity-event triggers.
--
-- Re-platforms the five Base44 entity-automation trigger functions
-- (onCheckInCreated, onCheckInResponded, onClientCreated, onIntakeSubmitted,
-- onWorkoutCompleted) as Postgres AFTER INSERT/UPDATE triggers that invoke the
-- onEntityEvent edge function via pg_net.http_post — the same pattern as the
-- pg_cron → runAutomations automation runner (migration 9).
--
-- 1. processed_entity_events — idempotency ledger (same claim/release
--    discipline as processed_stripe_events from Step 5a): every trigger
--    firing carries a unique event_key; onEntityEvent claims it before doing
--    any work, so duplicate deliveries can never double-send messages,
--    notifications, or emails.
-- 2. app.notify_entity_event() — generic AFTER trigger that posts
--    { event_key, event_type, record, old_record } to the edge function.
--    The endpoint URL + service key are read from Vault (secrets
--    'project_url' and 'service_role_key' — set once per environment:
--      select vault.create_secret('<SUPABASE_URL>', 'project_url');
--      select vault.create_secret('<SERVICE_ROLE_KEY>', 'service_role_key');
--    ). Missing secrets / missing pg_net make the trigger a no-op WARNING —
--    an automation must never block the business write it observes.
-- 3. Five (six, counting the completed-workout INSERT/UPDATE pair) triggers.
-- ============================================================================

-- --- 1. idempotency ledger ---------------------------------------------------
create table public.processed_entity_events (
  event_key text primary key,              -- '<event_type>:<row id>:<epoch us>'
  event_type text,
  processed_at timestamptz not null default now()
);

alter table public.processed_entity_events enable row level security;
-- Service role (the edge function) bypasses RLS. Admins may read for
-- debugging; nobody else sees it (default-deny).
create policy "select admin" on public.processed_entity_events
  for select to authenticated using (app.is_admin());

-- --- 2. generic notifier -----------------------------------------------------
create or replace function app.notify_entity_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_key text;
  v_event_key text;
  v_payload jsonb;
begin
  -- Endpoint config from Vault. Any failure here (no vault, no secrets, no
  -- pg_net) must not block the triggering write.
  begin
    select decrypted_secret into v_url
      from vault.decrypted_secrets where name = 'project_url' limit 1;
    select decrypted_secret into v_key
      from vault.decrypted_secrets where name = 'service_role_key' limit 1;
  exception when others then
    v_url := null;
  end;

  if v_url is null or v_key is null then
    raise warning 'entity event % for row % skipped: vault secrets project_url/service_role_key not configured',
      tg_argv[0], new.id;
    return null;
  end if;

  -- One key per logical transition: retries of the same delivery reuse the
  -- key (it is embedded in the payload), while a later re-transition of the
  -- same row (e.g. a check-in un-responded and re-responded) gets a new one.
  v_event_key := format('%s:%s:%s', tg_argv[0], new.id,
    to_char(clock_timestamp(), 'YYYYMMDDHH24MISSUS'));

  v_payload := jsonb_build_object(
    'event_key', v_event_key,
    'event_type', tg_argv[0],
    'record', to_jsonb(new),
    'old_record', case when tg_op = 'UPDATE' then to_jsonb(old) end
  );

  begin
    perform net.http_post(
      url     := v_url || '/functions/v1/onEntityEvent',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer ' || v_key
      ),
      body    := v_payload
    );
  exception when others then
    raise warning 'entity event % for row % failed to post: %', tg_argv[0], new.id, sqlerrm;
  end;

  return null; -- AFTER trigger
end;
$$;

comment on function app.notify_entity_event() is
  'Step 5c: posts entity events (check-in/client/intake/workout) to the onEntityEvent edge function via pg_net. Fire-and-forget: never blocks the business write.';

-- --- 3. the triggers ---------------------------------------------------------
-- onCheckInCreated: every new check-in.
create trigger trg_entity_event_checkin_created
  after insert on public.check_ins
  for each row
  execute function app.notify_entity_event('checkin.created');

-- onCheckInResponded: only the false→true transition of coach_responded
-- (verbatim Base44 gate: "!checkIn.coach_responded || oldData.coach_responded
-- → skip").
create trigger trg_entity_event_checkin_responded
  after update on public.check_ins
  for each row
  when (new.coach_responded and not old.coach_responded)
  execute function app.notify_entity_event('checkin.responded');

-- onClientCreated: every new client.
create trigger trg_entity_event_client_created
  after insert on public.clients
  for each row
  execute function app.notify_entity_event('client.created');

-- onIntakeSubmitted: every new public intake.
create trigger trg_entity_event_intake_submitted
  after insert on public.onboarding_responses
  for each row
  execute function app.notify_entity_event('intake.submitted');

-- onWorkoutCompleted: sessions that arrive completed, or transition into
-- completed. (Two triggers because a WHEN clause cannot branch on TG_OP.)
create trigger trg_entity_event_workout_completed_ins
  after insert on public.workout_sessions
  for each row
  when (new.status = 'completed')
  execute function app.notify_entity_event('workout.completed');

create trigger trg_entity_event_workout_completed_upd
  after update on public.workout_sessions
  for each row
  when (new.status = 'completed' and old.status is distinct from 'completed')
  execute function app.notify_entity_event('workout.completed');
