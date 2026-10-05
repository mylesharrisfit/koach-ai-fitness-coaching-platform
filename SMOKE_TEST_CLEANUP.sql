-- =============================================================================
-- SMOKE_TEST_CLEANUP.sql   (WRITTEN, NOT RUN)
-- Project: phjmcihgodvhbiaksvyl      Smoke test date: 2026-10-05
--
-- Removes every row/object created by the smoke test and reverts coach A's
-- Enterprise grant. Nothing here touches the 9 pre-existing real users
-- (including ansh.patel102104@gmail.com, mylesharrisfitbusiness@gmail.com),
-- nor the 3 processed_entity_events rows dated 2026-10-02.
--
-- HOW TO USE
--   * Section 0 = preview counts (read-only).
--   * Section 1 = REVERT ONLY: coach A back to starter (keeps all test data).
--   * Section 2 = FULL CLEANUP inside a transaction. The script ends with
--     ROLLBACK so a first run changes nothing; change the last line to COMMIT
--     once the counts in the NOTICE/SELECT output look right.
--   * Section 3 = storage objects. Prefer the Storage API (see note) so the
--     underlying blobs are removed, not just the metadata rows.
--
-- TEST ACCOUNTS (all created by the smoke test)
--   779f4ff8-a676-4380-92f0-5759ff215c77  ansh.patel102104+coacha@gmail.com   (smoke-coach-a)
--   2e0b6a06-d60b-4ed5-8363-71c9b81219a9  ansh.patel102104+coachb@gmail.com   (smoke-coach-b)
--   94f04fb2-ec42-4889-a7f3-7d7dfaa8bb75  smoke-client-a2@example.invalid     (portal login for client A2)
--   03488a50-01c7-47ba-9b22-63801b658fd2  smoke-client-b1@example.invalid     (portal login for client B1)
--
-- NOTE: the message that cut off your request said "...and reverts coach";
-- this script assumes "coach A's Enterprise grant". Section 1 covers that.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- SECTION 0: PREVIEW (read-only)
-- -----------------------------------------------------------------------------
with u as (
  select unnest(array[
    '779f4ff8-a676-4380-92f0-5759ff215c77',
    '2e0b6a06-d60b-4ed5-8363-71c9b81219a9',
    '94f04fb2-ec42-4889-a7f3-7d7dfaa8bb75',
    '03488a50-01c7-47ba-9b22-63801b658fd2'
  ]::uuid[]) as id
), c as (
  select id from public.clients
  where user_id in (select id from u) or created_by in (select id from u)
)
select 'clients'              t, count(*) n from public.clients where id in (select id from c)
union all select 'check_ins',         count(*) from public.check_ins         where client_id in (select id from c)
union all select 'messages',          count(*) from public.messages          where client_id in (select id from c)
union all select 'weigh_ins',         count(*) from public.weigh_ins         where client_id in (select id from c)
union all select 'food_logs',         count(*) from public.food_logs         where client_id in (select id from c)
union all select 'workout_sessions',  count(*) from public.workout_sessions  where client_id in (select id from c)
union all select 'workout_programs',  count(*) from public.workout_programs  where created_by in (select id from u)
union all select 'nutrition_plans',   count(*) from public.nutrition_plans   where created_by in (select id from u)
union all select 'exercise_library',  count(*) from public.exercise_library  where created_by in (select id from u)
union all select 'teams',             count(*) from public.teams             where owner_coach_id in (select id from u)
union all select 'referral_programs', count(*) from public.referral_programs where coach_id in (select id from u)
union all select 'automation_rules',  count(*) from public.automation_rules  where created_by in (select id from u)
union all select 'onboarding_responses', count(*) from public.onboarding_responses where coach_id in (select id from u)
union all select 'notifications',     count(*) from public.notifications     where recipient_id in (select id from u) or created_by in (select id from u)
union all select 'processed_entity_events (since 15:45Z)', count(*) from public.processed_entity_events where processed_at >= '2026-10-05 15:45:00+00'
union all select 'profiles',          count(*) from public.profiles          where id in (select id from u)
union all select 'auth.users',        count(*) from auth.users               where id in (select id from u);
-- Expected at time of writing (2026-10-05 ~17:30Z), roughly:
--   clients 18, exercise_library 249, messages 9, check_ins 3, weigh_ins 3,
--   food_logs 2, workout_sessions 3, workout_programs 3, nutrition_plans 1,
--   teams 4, referral_programs 4, automation_rules 2, onboarding_responses 1,
--   notifications 24, profiles 4, auth.users 4.
-- (Counts will be higher if more smoke-test steps have run since.)


-- -----------------------------------------------------------------------------
-- SECTION 1: REVERT ONLY  (run this alone to undo just the paywall grant)
-- This is the exact inverse of the single statement that granted Enterprise:
--   update public.profiles set subscription_tier='enterprise', billing_status='active'
--   where id='779f4ff8-a676-4380-92f0-5759ff215c77';
-- -----------------------------------------------------------------------------
-- update public.profiles
--    set subscription_tier = 'starter', billing_status = 'active'
--  where id = '779f4ff8-a676-4380-92f0-5759ff215c77';
--
-- Coach B was changed by the test only in non-privileged columns:
-- update public.profiles set billing_cycle = null, bio = null
--  where id = '2e0b6a06-d60b-4ed5-8363-71c9b81219a9';
--   (check the original values first: billing_cycle was set to 'annual' and bio to
--    'smoke bio' by the privilege-escalation test; ai_generation_count is 1 from AI calls.)
-- Coach B's auth user_metadata was also set to {role:'admin', subscription_tier:'enterprise'}
-- by auth.updateUser (harmless: nothing reads it). It disappears if the user is deleted.


-- -----------------------------------------------------------------------------
-- SECTION 2: FULL CLEANUP (transaction; ends in ROLLBACK until you change it)
-- -----------------------------------------------------------------------------
begin;

create temp table _smoke_users on commit drop as
  select unnest(array[
    '779f4ff8-a676-4380-92f0-5759ff215c77',
    '2e0b6a06-d60b-4ed5-8363-71c9b81219a9',
    '94f04fb2-ec42-4889-a7f3-7d7dfaa8bb75',
    '03488a50-01c7-47ba-9b22-63801b658fd2'
  ]::uuid[]) as id;

-- every client owned or created by a test user (includes: A-secret-client,
-- Smoke Client One, Smoke Client A2, Smoke Client B1, cap-test-1..12,
-- client-made-client*, and any B-spoof/other attempts)
create temp table _smoke_clients on commit drop as
  select id from public.clients
  where user_id in (select id from _smoke_users)
     or created_by in (select id from _smoke_users);

create temp table _smoke_teams on commit drop as
  select id from public.teams where owner_coach_id in (select id from _smoke_users)
  union select id from public.teams where created_by in (select id from _smoke_users);

-- children of clients first
delete from public.messages          where client_id in (select id from _smoke_clients) or created_by in (select id from _smoke_users);
delete from public.check_ins         where client_id in (select id from _smoke_clients) or created_by in (select id from _smoke_users);
delete from public.weigh_ins         where client_id in (select id from _smoke_clients) or created_by in (select id from _smoke_users);
delete from public.food_logs         where client_id in (select id from _smoke_clients) or created_by in (select id from _smoke_users);
delete from public.workout_sessions  where client_id in (select id from _smoke_clients) or created_by in (select id from _smoke_users);
delete from public.in_body_scans     where client_id in (select id from _smoke_clients);
delete from public.daily_logs        where client_id in (select id from _smoke_clients);
delete from public.goals             where client_id in (select id from _smoke_clients);
delete from public.habits            where client_id in (select id from _smoke_clients);
delete from public.habit_completions where client_id in (select id from _smoke_clients);
delete from public.client_badges     where client_id in (select id from _smoke_clients);
delete from public.coaching_sessions where client_id in (select id from _smoke_clients);
delete from public.invoices          where client_id in (select id from _smoke_clients);
delete from public.payments          where client_id in (select id from _smoke_clients);
delete from public.plan_versions     where client_id in (select id from _smoke_clients);
delete from public.ai_conversations  where client_id in (select id from _smoke_clients) or created_by in (select id from _smoke_users);
delete from public.automation_logs   where client_id in (select id from _smoke_clients);
delete from public.zapier_logs       where client_id in (select id from _smoke_clients);

-- clients (clears assigned_program_id / assigned_nutrition_id references)
delete from public.clients where id in (select id from _smoke_clients);

-- coach-owned content
delete from public.nutrition_plans   where created_by in (select id from _smoke_users);
delete from public.workout_programs  where created_by in (select id from _smoke_users);
delete from public.exercise_library  where created_by in (select id from _smoke_users);   -- 249 seeded/AI-generated rows
delete from public.referral_programs where coach_id   in (select id from _smoke_users) or created_by in (select id from _smoke_users);
delete from public.automation_rules  where created_by in (select id from _smoke_users);   -- 2 rows created by client logins
delete from public.onboarding_responses
  where coach_id in (select id from _smoke_users) or name = 'B-intake-probe';              -- anonymous intake probe row
delete from public.notifications     where recipient_id in (select id from _smoke_users) or created_by in (select id from _smoke_users);
delete from public.push_subscriptions where user_id in (select id from _smoke_users);

-- teams
delete from public.team_members where team_id in (select id from _smoke_teams) or user_id in (select id from _smoke_users);
delete from public.teams        where id in (select id from _smoke_teams);

-- per-coach settings rows, if any were auto-created (all were 0 at time of writing)
delete from public.coach_settings        where coach_id in (select id from _smoke_users);
delete from public.coach_defaults        where coach_id in (select id from _smoke_users);
delete from public.coach_profiles        where coach_id in (select id from _smoke_users);
delete from public.business_settings     where coach_id in (select id from _smoke_users);
delete from public.notification_settings where coach_id in (select id from _smoke_users);
delete from public.reminder_settings     where coach_id in (select id from _smoke_users);
delete from public.white_label_settings  where coach_id in (select id from _smoke_users);
delete from public.community_settings    where coach_id in (select id from _smoke_users);

-- event-dedup rows written by the entity-event triggers during the smoke test.
-- The 3 rows dated 2026-10-02 pre-date the test and are intentionally kept.
delete from public.processed_entity_events where processed_at >= '2026-10-05 15:45:00+00';

-- accounts last
delete from public.profiles where id in (select id from _smoke_users);
delete from auth.users      where id in (select id from _smoke_users);   -- cascades identities/sessions/refresh tokens

-- verification: every count below should be 0
select 'auth.users left'  t, count(*) from auth.users where id in (select id from _smoke_users)
union all select 'profiles left', count(*) from public.profiles where id in (select id from _smoke_users)
union all select 'clients left',  count(*) from public.clients  where id in (select id from _smoke_clients)
union all select 'exercise_library left', count(*) from public.exercise_library where created_by in (select id from _smoke_users)
union all select 'real users untouched (expect 9)', count(*) from auth.users;

rollback;   -- <<< change to COMMIT; after reviewing the verification output


-- -----------------------------------------------------------------------------
-- SECTION 3: STORAGE OBJECTS (3 objects at time of writing)
--   uploads/779f4ff8-a676-4380-92f0-5759ff215c77/smoke-secret.png   (70 bytes, coach A)
--   branding/779f4ff8-a676-4380-92f0-5759ff215c77/logo.png           (70 bytes, coach A)
--   uploads/2e0b6a06-d60b-4ed5-8363-71c9b81219a9/own-control.png     (70 bytes, coach B)
--
-- Preferred: delete through the Storage API / dashboard so the blobs are removed:
--   supabase.storage.from('uploads').remove([
--     '779f4ff8-a676-4380-92f0-5759ff215c77/smoke-secret.png',
--     '2e0b6a06-d60b-4ed5-8363-71c9b81219a9/own-control.png' ]);
--   supabase.storage.from('branding').remove(['779f4ff8-a676-4380-92f0-5759ff215c77/logo.png']);
--   (run with the service-role key, or as the owning user's session)
--
-- SQL equivalent (removes the metadata rows only; Supabase recommends the API):
-- delete from storage.objects
--  where (bucket_id = 'uploads'  and (name like '779f4ff8-a676-4380-92f0-5759ff215c77/%'
--                                 or  name like '2e0b6a06-d60b-4ed5-8363-71c9b81219a9/%'
--                                 or  name like '94f04fb2-ec42-4889-a7f3-7d7dfaa8bb75/%'
--                                 or  name like '03488a50-01c7-47ba-9b22-63801b658fd2/%'))
--     or (bucket_id = 'branding' and (name like '779f4ff8-a676-4380-92f0-5759ff215c77/%'
--                                 or  name like '2e0b6a06-d60b-4ed5-8363-71c9b81219a9/%'));
-- -----------------------------------------------------------------------------
