-- ============================================================================
-- Migration 8 (Step 2 follow-up) — columns observed in REAL Base44 data that
-- the entity .jsonc schemas never declared.
--
-- Discovered by diffing a full export of the live Base44 app against
-- information_schema during the Step 2a data-migration rehearsal. Two
-- entities carried undeclared product fields; without these columns the
-- migration would drop them (logged, but lost to the app).
--
-- Deliberately NOT ported: Base44 auth-platform fields on User (disabled,
-- disabled_reason, force_password_reset, is_verified, is_service,
-- collaborator_role, _app_role) — that state belongs to Supabase Auth
-- (Step 3), not to profiles; the migration script drops them explicitly.
-- ============================================================================

-- User rows carried coach-onboarding and billing-adjacent fields
alter table public.profiles
  add column onboarding_complete boolean not null default false,
  add column had_trial boolean not null default false,
  add column phone text,
  add column avatar_url text,
  add column timezone text,
  add column payment_method text,
  add column coaching_style text,
  add column coaching_specialties text[] not null default '{}',
  add column coaching_experience text,
  add column current_client_count text,
  add column client_range text,
  add column certifications text;

-- CheckInForm rows carried live usage counters
alter table public.check_in_forms
  add column submission_count integer not null default 0,
  add column last_submission_date timestamptz;

-- Notification.category: real rows use 14 values, the .jsonc enum declared 8
-- (219 of 274 live rows are 'client_activity'). Widened to the union.
alter table public.notifications
  drop constraint notifications_category_check,
  add constraint notifications_category_check check (category in
    ('client', 'message', 'payment', 'ai', 'schedule', 'system', 'checkin', 'atrisk',
     'client_activity', 'reminder', 'workout', 'achievement', 'nutrition', 'intake'));
