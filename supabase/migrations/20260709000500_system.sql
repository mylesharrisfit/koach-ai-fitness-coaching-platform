-- ============================================================================
-- Migration 5 — SYSTEM & SETTINGS: automation, notifications, integration
-- logs, AI conversations, CSV import jobs, and the per-coach settings
-- singletons (business, coach, defaults, profile, notifications, reminders,
-- white-label).
--
-- Automation/integration log tables are written by the server-side runner
-- (Step 4) via the service role, which bypasses RLS; their policies mirror
-- Base44's admin-only access.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- automation_rules  (Base44: AutomationRule)
-- ---------------------------------------------------------------------------
create table public.automation_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  trigger_type text,
  trigger_value numeric(10, 2),
  trigger_days numeric(6, 1),
  actions jsonb not null default '[]',
  is_active boolean not null default true,
  run_once boolean not null default false,
  apply_to text not null default 'all',
  last_triggered timestamptz,
  trigger_count integer not null default 0,
  -- legacy engine fields, kept for data compatibility
  condition_type text,
  condition_threshold numeric(10, 2),
  action_type text,
  action_message text,
  action_calorie_delta numeric(7, 1),
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.automation_rules enable row level security;
select app.add_updated_at_trigger('public.automation_rules');
create index automation_rules_created_by_idx on public.automation_rules (created_by);

create policy "select own or admin" on public.automation_rules
  for select to authenticated using (created_by = (select auth.uid()) or app.is_admin());
create policy "insert own" on public.automation_rules
  for insert to authenticated with check (created_by = (select auth.uid()));
create policy "update own or admin" on public.automation_rules
  for update to authenticated
  using (created_by = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or app.is_admin());
create policy "delete own or admin" on public.automation_rules
  for delete to authenticated using (created_by = (select auth.uid()) or app.is_admin());

-- ---------------------------------------------------------------------------
-- automation_logs  (Base44: AutomationLog)
-- Base44 was strictly admin-only; preserved, PLUS a documented addition:
-- a coach may read log entries for their own rules (flagged).
-- Writes happen via the service role (automation runner).
-- ---------------------------------------------------------------------------
create table public.automation_logs (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.automation_rules (id) on delete cascade,
  rule_name text,
  client_id uuid not null references public.clients (id) on delete cascade,
  client_name text,
  triggered_at timestamptz,
  actions_taken text,
  description text,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.automation_logs enable row level security;
select app.add_updated_at_trigger('public.automation_logs');
create index automation_logs_rule_id_idx on public.automation_logs (rule_id);
create index automation_logs_client_id_idx on public.automation_logs (client_id);

create policy "select rule owner or admin" on public.automation_logs
  for select to authenticated
  using (
    app.is_admin()
    or exists (select 1 from public.automation_rules r
               where r.id = rule_id and r.created_by = (select auth.uid()))
  );
create policy "insert admin" on public.automation_logs
  for insert to authenticated with check (app.is_admin());
create policy "update admin" on public.automation_logs
  for update to authenticated using (app.is_admin()) with check (app.is_admin());
create policy "delete admin" on public.automation_logs
  for delete to authenticated using (app.is_admin());

-- ---------------------------------------------------------------------------
-- notifications  (Base44: Notification)
-- recipient_id was an EMAIL in Base44; normalized to a uuid referencing the
-- recipient's auth user (data migration must map emails -> ids; flagged).
-- Insert is tightened vs Base44 (which let anyone notify anyone): rows are
-- created by the service role or admins; users manage their own inbox.
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users (id) on delete cascade,
  category text not null default 'system' check (category in
    ('client', 'message', 'payment', 'ai', 'schedule', 'system', 'checkin', 'atrisk')),
  type text not null default 'general',
  title text not null,
  body text,
  client_name text,
  action_label text,
  link text,
  is_read boolean not null default false,
  is_dismissed boolean not null default false,
  related_client_id uuid references public.clients (id) on delete set null,
  related_checkin_id uuid references public.check_ins (id) on delete set null,
  priority text not null default 'normal' check (priority in ('low', 'normal', 'high', 'urgent')),
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notifications enable row level security;
select app.add_updated_at_trigger('public.notifications');
create index notifications_recipient_idx on public.notifications (recipient_id, is_read);

create policy "select own inbox or admin" on public.notifications
  for select to authenticated
  using (recipient_id = (select auth.uid()) or app.is_admin());
create policy "insert self or admin" on public.notifications
  for insert to authenticated
  with check (recipient_id = (select auth.uid()) or app.is_admin());
create policy "update own inbox or admin" on public.notifications
  for update to authenticated
  using (recipient_id = (select auth.uid()) or app.is_admin())
  with check (recipient_id = (select auth.uid()) or app.is_admin());
create policy "delete own inbox or admin" on public.notifications
  for delete to authenticated
  using (recipient_id = (select auth.uid()) or app.is_admin());

-- ---------------------------------------------------------------------------
-- zapier_logs  (Base44: ZapierLog) — admin/service-role only, as in Base44.
-- payload was a "JSON string" in Base44; stored as jsonb here (flagged).
-- ---------------------------------------------------------------------------
create table public.zapier_logs (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  client_id uuid references public.clients (id) on delete cascade,
  client_name text,
  payload jsonb,
  sent_at timestamptz not null,
  success boolean not null default true,
  description text,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.zapier_logs enable row level security;
select app.add_updated_at_trigger('public.zapier_logs');
create index zapier_logs_client_id_idx on public.zapier_logs (client_id);

create policy "select admin" on public.zapier_logs
  for select to authenticated using (app.is_admin());
create policy "insert admin" on public.zapier_logs
  for insert to authenticated with check (app.is_admin());
create policy "update admin" on public.zapier_logs
  for update to authenticated using (app.is_admin()) with check (app.is_admin());
create policy "delete admin" on public.zapier_logs
  for delete to authenticated using (app.is_admin());

-- ---------------------------------------------------------------------------
-- ai_conversations  (Base44: AIConversation)
-- ---------------------------------------------------------------------------
create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients (id) on delete cascade,
  client_name text,
  title text,
  description text,
  messages jsonb not null default '[]',
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ai_conversations enable row level security;
select app.add_updated_at_trigger('public.ai_conversations');
create index ai_conversations_client_id_idx on public.ai_conversations (client_id);
create index ai_conversations_created_by_idx on public.ai_conversations (created_by);

create policy "select own or portal or admin" on public.ai_conversations
  for select to authenticated
  using (created_by = (select auth.uid()) or app.is_portal_client(client_id) or app.is_admin());
create policy "insert own" on public.ai_conversations
  for insert to authenticated with check (created_by = (select auth.uid()) and (client_id is null or app.owns_client(client_id)));
create policy "update own or admin" on public.ai_conversations
  for update to authenticated
  using (created_by = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or app.is_admin());
create policy "delete own or admin" on public.ai_conversations
  for delete to authenticated
  using (created_by = (select auth.uid()) or app.is_admin());

-- ---------------------------------------------------------------------------
-- client_import_jobs  (Base44: ClientImportJob)
-- all_rows can be large; kept jsonb to match Base44 (an object-storage
-- staging area is an improvement candidate, noted in the doc).
-- ---------------------------------------------------------------------------
create table public.client_import_jobs (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in
    ('pending', 'mapped', 'confirmed', 'committed', 'failed')),
  source_platform text,
  file_name text,
  headers text[] not null default '{}',
  sample_rows jsonb not null default '[]',
  all_rows jsonb not null default '[]',
  column_mapping jsonb not null default '{}',
  mapping_confidence jsonb not null default '{}',
  total_rows integer,
  imported_count integer not null default 0,
  skipped_count integer not null default 0,
  flagged_count integer not null default 0,
  error_log text[] not null default '{}',
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.client_import_jobs enable row level security;
select app.add_updated_at_trigger('public.client_import_jobs');
create index client_import_jobs_coach_id_idx on public.client_import_jobs (coach_id);

create policy "select own or admin" on public.client_import_jobs
  for select to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "insert own" on public.client_import_jobs
  for insert to authenticated with check (created_by = (select auth.uid()) and coach_id = (select auth.uid()));
create policy "update own or admin" on public.client_import_jobs
  for update to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "delete own or admin" on public.client_import_jobs
  for delete to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());

-- ---------------------------------------------------------------------------
-- business_settings  (Base44: BusinessSettings) — singleton per coach
-- ---------------------------------------------------------------------------
create table public.business_settings (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references public.profiles (id) on delete cascade,
  checkin_frequency text not null default 'weekly',
  checkin_due_day smallint not null default 1,
  checkin_reminder_hours integer not null default 24,
  auto_assign_checkin_form boolean not null default false,
  default_checkin_form_id uuid references public.check_in_forms (id) on delete set null,
  auto_assign_program boolean not null default false,
  default_program_id uuid references public.workout_programs (id) on delete set null,
  auto_assign_meal_plan boolean not null default false,
  default_meal_plan_id uuid references public.nutrition_plans (id) on delete set null,
  welcome_message_enabled boolean not null default true,
  welcome_message text,
  max_clients_unlimited boolean not null default true,
  max_clients integer not null default 50,
  waitlist_enabled boolean not null default false,
  capacity_alerts boolean not null default true,
  default_tags text[] not null default '{}',
  auto_tag_at_risk_pct numeric(5, 2) not null default 60,
  auto_tag_high_performer_pct numeric(5, 2) not null default 90,
  auto_tag_new_client_days integer not null default 30,
  onboarding_items jsonb not null default '[]',
  onboarding_deadline_days integer not null default 7,
  onboarding_remind_days integer not null default 3,
  onboarding_notify_coach boolean not null default true,
  welcome_email_enabled boolean not null default true,
  welcome_email_template text,
  welcome_video_enabled boolean not null default false,
  welcome_video_url text,
  intake_form_id uuid references public.check_in_forms (id) on delete set null,
  require_intake_before_program boolean not null default false,
  intake_reminder_days integer not null default 2,
  program_progression text not null default 'manual',
  progression_completion_pct numeric(5, 2) not null default 80,
  progression_adherence_pct numeric(5, 2) not null default 80,
  progression_adherence_weeks integer not null default 2,
  default_rest_day_text text,
  default_program_notes text,
  macro_method text not null default 'manual',
  default_protein_per_lb numeric(4, 2) not null default 1.0,
  default_deficit_pct numeric(5, 2) not null default 15,
  default_surplus_pct numeric(5, 2) not null default 10,
  default_water_liters numeric(4, 1) not null default 2.5,
  default_meal_frequency smallint not null default 3,
  working_hours jsonb,
  response_time text not null default '24h',
  auto_reply_enabled boolean not null default false,
  auto_reply_message text,
  allow_session_requests boolean not null default true,
  session_types jsonb not null default '[]',
  booking_notice_hours integer not null default 24,
  max_sessions_per_month integer not null default 0,
  session_buffer_minutes integer not null default 0,
  pipeline_stages jsonb not null default '[]',
  auto_move_pipeline_days integer not null default 7,
  auto_move_pipeline_enabled boolean not null default false,
  followup_reminder_enabled boolean not null default true,
  followup_reminder_days integer not null default 3,
  brand_color text not null default '#2563EB',
  logo_url text,
  email_signature text,
  reply_to_email text,
  description text,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.business_settings enable row level security;
select app.add_updated_at_trigger('public.business_settings');
create unique index business_settings_coach_id_key on public.business_settings (coach_id)
  where coach_id is not null;

create policy "select own or admin" on public.business_settings
  for select to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "insert own" on public.business_settings
  for insert to authenticated with check (created_by = (select auth.uid()) and (coach_id is null or coach_id = (select auth.uid())));
create policy "update own or admin" on public.business_settings
  for update to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "delete admin" on public.business_settings
  for delete to authenticated using (app.is_admin());

-- ---------------------------------------------------------------------------
-- coach_settings  (Base44: CoachSettings) — integrations singleton per coach.
-- NOTE: zoom_access_token is a live secret stored in a user-readable row
-- (same as Base44). Moving it to Supabase Vault / an edge-function-only
-- store is strongly recommended — flagged as an open question.
-- ---------------------------------------------------------------------------
create table public.coach_settings (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references public.profiles (id) on delete cascade,
  zapier_webhook_url text,
  zapier_events text[] not null default '{}',
  zapier_connected boolean not null default false,
  zapier_last_triggered timestamptz,
  google_calendar_connected boolean not null default false,
  google_calendar_id text not null default 'primary',
  default_session_duration integer not null default 60,
  buffer_time integer not null default 0,
  auto_send_invites boolean not null default false,
  working_hours_start time not null default '09:00',
  working_hours_end time not null default '18:00',
  zoom_connected boolean not null default false,
  zoom_access_token text,
  zoom_user_email text,
  zoom_default_duration integer not null default 60,
  zoom_waiting_room boolean not null default true,
  zoom_auto_record boolean not null default false,
  calendly_connected boolean not null default false,
  calendly_user_uri text,
  calendly_scheduling_url text,
  calendly_username text,
  resend_connected boolean not null default false,
  resend_from_email text,
  resend_from_name text,
  -- legacy SendGrid fields (migrated to Resend)
  sendgrid_connected boolean not null default false,
  sendgrid_from_email text,
  sendgrid_from_name text,
  sendgrid_auto_welcome boolean not null default false,
  sendgrid_auto_checkin_reminder boolean not null default false,
  sendgrid_auto_progress_report boolean not null default false,
  sendgrid_auto_badge_email boolean not null default false,
  description text,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.coach_settings enable row level security;
select app.add_updated_at_trigger('public.coach_settings');
create unique index coach_settings_coach_id_key on public.coach_settings (coach_id)
  where coach_id is not null;

create policy "select own or admin" on public.coach_settings
  for select to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "insert own" on public.coach_settings
  for insert to authenticated with check (created_by = (select auth.uid()) and (coach_id is null or coach_id = (select auth.uid())));
create policy "update own or admin" on public.coach_settings
  for update to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "delete admin" on public.coach_settings
  for delete to authenticated using (app.is_admin());

-- ---------------------------------------------------------------------------
-- coach_defaults  (Base44: CoachDefaults) — singleton per coach
-- (coach_id documented as "coach user email" in Base44 -> uuid here; flagged)
-- ---------------------------------------------------------------------------
create table public.coach_defaults (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references public.profiles (id) on delete cascade,
  auto_assign_enabled boolean not null default true,
  default_program_id uuid references public.workout_programs (id) on delete set null,
  default_nutrition_id uuid references public.nutrition_plans (id) on delete set null,
  send_welcome_message boolean not null default true,
  welcome_message text,
  checkin_frequency text not null default 'weekly'
    check (checkin_frequency in ('weekly', 'biweekly', 'monthly')),
  description text,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.coach_defaults enable row level security;
select app.add_updated_at_trigger('public.coach_defaults');
create unique index coach_defaults_coach_id_key on public.coach_defaults (coach_id)
  where coach_id is not null;

create policy "select own or admin" on public.coach_defaults
  for select to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "insert own" on public.coach_defaults
  for insert to authenticated with check (created_by = (select auth.uid()) and (coach_id is null or coach_id = (select auth.uid())));
create policy "update own or admin" on public.coach_defaults
  for update to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "delete admin" on public.coach_defaults
  for delete to authenticated using (app.is_admin());

-- ---------------------------------------------------------------------------
-- coach_profiles  (Base44: CoachProfile) — public-facing coach bio.
-- is_public materialized (referenced by Base44 RLS, not in the field list);
-- anon read for published profiles (landing pages).
-- ---------------------------------------------------------------------------
create table public.coach_profiles (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references public.profiles (id) on delete cascade,
  first_name text,
  last_name text,
  title text,
  pronouns text,
  avatar_url text,
  business_name text,
  business_email text,
  business_phone text,
  website_url text,
  instagram text,
  tiktok text,
  youtube text,
  location text,
  timezone text not null default 'America/New_York',
  short_bio text,
  full_bio text,
  specialties text[] not null default '{}',
  certifications jsonb not null default '[]',
  years_experience text,
  languages text[] not null default '{}',
  is_public boolean not null default false,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.coach_profiles enable row level security;
select app.add_updated_at_trigger('public.coach_profiles');
create unique index coach_profiles_coach_id_key on public.coach_profiles (coach_id)
  where coach_id is not null;

create policy "select own or public or admin" on public.coach_profiles
  for select to anon, authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid())
         or is_public or app.is_admin());
create policy "insert own" on public.coach_profiles
  for insert to authenticated with check (created_by = (select auth.uid()) and (coach_id is null or coach_id = (select auth.uid())));
create policy "update own or admin" on public.coach_profiles
  for update to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "delete admin" on public.coach_profiles
  for delete to authenticated using (app.is_admin());

-- ---------------------------------------------------------------------------
-- notification_settings  (Base44: NotificationSettings) — singleton per coach
-- ---------------------------------------------------------------------------
create table public.notification_settings (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references public.profiles (id) on delete cascade,
  all_notifications_enabled boolean not null default true,
  push_enabled boolean not null default true,
  email_enabled boolean not null default true,
  inapp_enabled boolean not null default true,
  quiet_hours_enabled boolean not null default false,
  quiet_hours_start time not null default '22:00',
  quiet_hours_end time not null default '07:00',
  client_activity jsonb,
  messages jsonb,
  payments jsonb,
  leads jsonb,
  ai_insights jsonb,
  scheduling jsonb,
  community jsonb,
  system jsonb,
  daily_digest_enabled boolean not null default true,
  daily_digest_time time not null default '07:00',
  daily_digest_includes text[] not null default '{}',
  weekly_digest_enabled boolean not null default true,
  weekly_digest_day smallint not null default 1,
  weekly_digest_time time not null default '08:00',
  weekly_digest_includes text[] not null default '{}',
  description text,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_settings enable row level security;
select app.add_updated_at_trigger('public.notification_settings');
create unique index notification_settings_coach_id_key on public.notification_settings (coach_id)
  where coach_id is not null;

create policy "select own or admin" on public.notification_settings
  for select to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "insert own" on public.notification_settings
  for insert to authenticated with check (created_by = (select auth.uid()) and (coach_id is null or coach_id = (select auth.uid())));
create policy "update own or admin" on public.notification_settings
  for update to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "delete admin" on public.notification_settings
  for delete to authenticated using (app.is_admin());

-- ---------------------------------------------------------------------------
-- reminder_settings  (Base44: ReminderSettings) — singleton per coach
-- ---------------------------------------------------------------------------
create table public.reminder_settings (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  reminder_24h_enabled boolean not null default true,
  reminder_24h_message text,
  reminder_1h_enabled boolean not null default true,
  reminder_1h_message text,
  noshow_enabled boolean not null default true,
  noshow_message text,
  description text,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (coach_id)
);

alter table public.reminder_settings enable row level security;
select app.add_updated_at_trigger('public.reminder_settings');

create policy "select own or admin" on public.reminder_settings
  for select to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "insert own" on public.reminder_settings
  for insert to authenticated with check (created_by = (select auth.uid()) and coach_id = (select auth.uid()));
create policy "update own or admin" on public.reminder_settings
  for update to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "delete admin" on public.reminder_settings
  for delete to authenticated using (app.is_admin());

-- ---------------------------------------------------------------------------
-- white_label_settings  (Base44: WhiteLabelSettings) — singleton per coach.
-- Published rows are readable anonymously (branded portal/login pages).
-- ---------------------------------------------------------------------------
create table public.white_label_settings (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references public.profiles (id) on delete cascade,
  is_published boolean not null default false,
  published_at timestamptz,
  draft_version integer not null default 1,
  publish_history jsonb not null default '[]',
  business_name text,
  app_name text,
  logo_primary_url text,
  logo_dark_url text,
  logo_light_url text,
  favicon_url text,
  app_icon_url text,
  app_icon_bg_color text not null default '#2563EB',
  primary_color text not null default '#2563EB',
  secondary_color text not null default '#7C3AED',
  gradient_direction text not null default '135deg',
  gradient_angle numeric(5, 1) not null default 135,
  bg_color text not null default '#F8F9FA',
  card_color text not null default '#FFFFFF',
  nav_color text not null default '#FFFFFF',
  text_primary text not null default '#0F172A',
  text_secondary text not null default '#64748B',
  link_color text not null default '#2563EB',
  font_primary text not null default 'Inter',
  font_heading_weight text not null default '700',
  portal_show_logo boolean not null default true,
  portal_hide_koach_badge boolean not null default false,
  portal_nav_style text not null default 'bottom',
  portal_nav_bg text not null default 'white',
  splash_enabled boolean not null default true,
  splash_bg_color text not null default '#2563EB',
  splash_animation text not null default 'spinner',
  login_bg_type text not null default 'gradient',
  login_bg_color text not null default '#2563EB',
  login_bg_image_url text,
  login_show_logo boolean not null default true,
  login_headline text,
  login_subtitle text,
  custom_domain text,
  custom_domain_status text not null default 'pending',
  email_show_logo boolean not null default true,
  email_header_bg text not null default '#2563EB',
  email_header_height text not null default 'standard',
  email_footer_name text,
  email_footer_address text,
  email_footer_social boolean not null default false,
  email_footer_social_links jsonb,
  email_footer_text text,
  email_hide_koach_badge boolean not null default false,
  terms_url text,
  terms_text text,
  privacy_url text,
  privacy_text text,
  custom_pages jsonb not null default '[]',
  welcome_video_url text,
  onboarding_headline text,
  onboarding_subtitle text,
  description text,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.white_label_settings enable row level security;
select app.add_updated_at_trigger('public.white_label_settings');
create unique index white_label_settings_coach_id_key on public.white_label_settings (coach_id)
  where coach_id is not null;

create policy "select own or published or admin" on public.white_label_settings
  for select to anon, authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid())
         or is_published or app.is_admin());
create policy "insert own" on public.white_label_settings
  for insert to authenticated with check (created_by = (select auth.uid()) and (coach_id is null or coach_id = (select auth.uid())));
create policy "update own or admin" on public.white_label_settings
  for update to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "delete admin" on public.white_label_settings
  for delete to authenticated using (app.is_admin());
