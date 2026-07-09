-- ============================================================================
-- Migration 2 — COACHING: programs, nutrition, logging, check-ins, habits,
-- goals, libraries, messaging, scheduling, onboarding intake.
--
-- Policy vocabulary (see SCHEMA_MIGRATION.md):
--   coach path  = created_by, and/or app.owns_client(client_id) for rows
--                 attached to a client, and/or app.is_team_member(team_id).
--   portal path = app.is_portal_client(client_id) — invite-token clients.
--   admin       = app.is_admin(), folded into every policy.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- exercise_library  (Base44: ExerciseLibrary)
-- is_public did not exist as a field but WAS referenced by Base44 RLS;
-- materialized here (default false).
-- ---------------------------------------------------------------------------
create table public.exercise_library (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  muscle_group text check (muscle_group in
    ('chest', 'back', 'shoulders', 'biceps', 'triceps', 'legs', 'glutes', 'core', 'full_body', 'cardio')),
  secondary_muscles text[] not null default '{}',
  equipment text not null default 'barbell' check (equipment in
    ('barbell', 'dumbbell', 'cable', 'machine', 'bodyweight', 'kettlebell', 'resistance_band', 'trx', 'other')),
  category text,
  movement_pattern text check (movement_pattern in
    ('push', 'pull', 'hinge', 'squat', 'carry', 'rotation', 'isometric', 'cardio')),
  difficulty text not null default 'intermediate'
    check (difficulty in ('beginner', 'intermediate', 'advanced')),
  instructions text[] not null default '{}',
  image_url text,
  video_url text,
  thumbnail_url text,
  is_coach_branded boolean not null default false,
  form_cues text[] not null default '{}',
  common_mistakes text[] not null default '{}',
  tempo text,
  default_rest_seconds integer not null default 90,
  description text,
  notes text,
  is_public boolean not null default false,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.exercise_library enable row level security;
select app.add_updated_at_trigger('public.exercise_library');
create index exercise_library_created_by_idx on public.exercise_library (created_by);

create policy "select own or public or admin" on public.exercise_library
  for select to authenticated
  using (created_by = (select auth.uid()) or is_public or app.is_admin());
create policy "insert own" on public.exercise_library
  for insert to authenticated with check (created_by = (select auth.uid()));
create policy "update own or admin" on public.exercise_library
  for update to authenticated
  using (created_by = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or app.is_admin());
create policy "delete own or admin" on public.exercise_library
  for delete to authenticated
  using (created_by = (select auth.uid()) or app.is_admin());

-- ---------------------------------------------------------------------------
-- workout_programs  (Base44: WorkoutProgram)
-- `workouts` (days -> exercises) stays jsonb: deeply nested, always read and
-- written as a whole document by the builder UI.
-- ---------------------------------------------------------------------------
create table public.workout_programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  duration_weeks integer,
  difficulty text not null default 'intermediate'
    check (difficulty in ('beginner', 'intermediate', 'advanced', 'elite')),
  category text not null default 'custom'
    check (category in ('strength', 'hypertrophy', 'fat_loss', 'athletic', 'mobility', 'custom')),
  days_per_week integer,
  workouts jsonb not null default '[]',
  is_template boolean not null default false,
  image_url text,
  team_id uuid references public.teams (id) on delete set null,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workout_programs enable row level security;
select app.add_updated_at_trigger('public.workout_programs');
create index workout_programs_team_id_idx on public.workout_programs (team_id);
create index workout_programs_created_by_idx on public.workout_programs (created_by);

-- Base44 RLS referenced data.client_id, which WorkoutProgram does not have;
-- assignment lives on clients.assigned_program_id, so the portal path checks
-- that instead (flagged in SCHEMA_MIGRATION.md).
create policy "select own or team or template or assigned portal or admin" on public.workout_programs
  for select to authenticated
  using (
    created_by = (select auth.uid())
    or app.is_team_member(team_id)
    or is_template
    or exists (select 1 from public.clients c
               where c.assigned_program_id = workout_programs.id
                 and app.is_portal_client(c.id))
    or app.is_admin()
  );
create policy "insert own" on public.workout_programs
  for insert to authenticated with check (created_by = (select auth.uid()) and (team_id is null or app.is_team_member(team_id)));
create policy "update own or team or admin" on public.workout_programs
  for update to authenticated
  using (created_by = (select auth.uid()) or app.is_team_member(team_id) or app.is_admin())
  with check (created_by = (select auth.uid()) or app.is_team_member(team_id) or app.is_admin());
create policy "delete own or team or admin" on public.workout_programs
  for delete to authenticated
  using (created_by = (select auth.uid()) or app.is_team_member(team_id) or app.is_admin());

-- ---------------------------------------------------------------------------
-- nutrition_plans  (Base44: NutritionPlan)
-- meals / rest_day_meals / hydration / coach_notes / supplements stay jsonb
-- (AI-generated documents, no stable inner schema).
-- assigned_clients kept as legacy uuid[] (no FK possible on arrays).
-- ---------------------------------------------------------------------------
create table public.nutrition_plans (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  tracking_mode text not null default 'macros' check (tracking_mode in ('macros', 'habits')),
  status text not null default 'active' check (status in ('active', 'inactive', 'draft', 'template')),
  client_id uuid references public.clients (id) on delete cascade,
  plan_type text not null default 'structured' check (plan_type in ('structured', 'pdf')),
  pdf_file_url text,
  calories numeric(7, 1),
  protein_g numeric(6, 1),
  carbs_g numeric(6, 1),
  fats_g numeric(6, 1),
  start_date date,
  meals jsonb not null default '[]',
  rest_day_meals jsonb not null default '[]',
  hydration jsonb,
  coach_notes jsonb,
  client_notes text,
  shopping_list text[] not null default '{}',
  supplements jsonb not null default '[]',
  assigned_clients uuid[] not null default '{}', -- legacy
  notes text,
  is_template boolean not null default false,
  template_category text,
  is_draft boolean not null default false,
  ai_generated boolean not null default false,
  goal text,
  diet text,
  team_id uuid references public.teams (id) on delete set null,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.nutrition_plans enable row level security;
select app.add_updated_at_trigger('public.nutrition_plans');
create index nutrition_plans_client_id_idx on public.nutrition_plans (client_id);
create index nutrition_plans_team_id_idx on public.nutrition_plans (team_id);
create index nutrition_plans_created_by_idx on public.nutrition_plans (created_by);

-- Base44 select oddly omitted created_by; restored here so coaches can read
-- their own non-template plans (flagged in SCHEMA_MIGRATION.md).
create policy "select own or team or template or portal or admin" on public.nutrition_plans
  for select to authenticated
  using (
    created_by = (select auth.uid())
    or app.is_team_member(team_id)
    or is_template
    or app.is_portal_client(client_id)
    or exists (select 1 from public.clients c
               where c.assigned_nutrition_id = nutrition_plans.id
                 and app.is_portal_client(c.id))
    or app.is_admin()
  );
create policy "insert own" on public.nutrition_plans
  for insert to authenticated with check (created_by = (select auth.uid()) and (client_id is null or app.owns_client(client_id)) and (team_id is null or app.is_team_member(team_id)));
create policy "update own or team or admin" on public.nutrition_plans
  for update to authenticated
  using (created_by = (select auth.uid()) or app.is_team_member(team_id) or app.is_admin())
  with check (created_by = (select auth.uid()) or app.is_team_member(team_id) or app.is_admin());
create policy "delete own or team or admin" on public.nutrition_plans
  for delete to authenticated
  using (created_by = (select auth.uid()) or app.is_team_member(team_id) or app.is_admin());

-- Deferred FKs from clients (created in the core migration)
alter table public.clients
  add constraint clients_assigned_program_id_fkey
    foreign key (assigned_program_id) references public.workout_programs (id) on delete set null,
  add constraint clients_assigned_nutrition_id_fkey
    foreign key (assigned_nutrition_id) references public.nutrition_plans (id) on delete set null;

-- ---------------------------------------------------------------------------
-- workout_sessions  (Base44: WorkoutSession) — client training log
-- ---------------------------------------------------------------------------
create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  program_id uuid references public.workout_programs (id) on delete set null,
  program_name text,
  workout_name text,
  workout_day_name text,
  workout_day_index integer,
  scheduled_date date,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'missed', 'skipped')),
  notes text,
  completed_at timestamptz,
  duration_minutes integer,
  session_rating numeric(3, 1),
  session_note text,
  exercises jsonb not null default '[]',
  exercise_logs jsonb not null default '[]',
  team_id uuid references public.teams (id) on delete set null,
  description text,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workout_sessions enable row level security;
select app.add_updated_at_trigger('public.workout_sessions');
create index workout_sessions_client_id_idx on public.workout_sessions (client_id);
create index workout_sessions_client_date_idx on public.workout_sessions (client_id, scheduled_date);
create index workout_sessions_team_id_idx on public.workout_sessions (team_id);

create policy "select coach or team or portal or admin" on public.workout_sessions
  for select to authenticated
  using (created_by = (select auth.uid()) or app.owns_client(client_id)
         or app.is_team_member(team_id) or app.is_portal_client(client_id) or app.is_admin());
create policy "insert coach or portal" on public.workout_sessions
  for insert to authenticated
  with check ((app.owns_client(client_id) and (team_id is null or app.is_team_member(team_id))) or app.is_portal_client(client_id) or app.is_admin());
create policy "update coach or team or portal or admin" on public.workout_sessions
  for update to authenticated
  using (created_by = (select auth.uid()) or app.owns_client(client_id)
         or app.is_team_member(team_id) or app.is_portal_client(client_id) or app.is_admin())
  with check (app.owns_client(client_id) or app.is_portal_client(client_id) or app.is_admin());
create policy "delete coach or team or portal or admin" on public.workout_sessions
  for delete to authenticated
  using (created_by = (select auth.uid()) or app.owns_client(client_id)
         or app.is_team_member(team_id) or app.is_portal_client(client_id) or app.is_admin());

-- ---------------------------------------------------------------------------
-- meal_templates  (Base44: MealTemplate)
-- ---------------------------------------------------------------------------
create table public.meal_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'other' check (category in
    ('breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout', 'other')),
  calories numeric(7, 1),
  protein_g numeric(6, 1),
  carbs_g numeric(6, 1),
  fats_g numeric(6, 1),
  instructions text,
  foods jsonb not null default '[]',
  tags text[] not null default '{}',
  description text,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.meal_templates enable row level security;
select app.add_updated_at_trigger('public.meal_templates');
create index meal_templates_created_by_idx on public.meal_templates (created_by);

create policy "select own or admin" on public.meal_templates
  for select to authenticated using (created_by = (select auth.uid()) or app.is_admin());
create policy "insert own" on public.meal_templates
  for insert to authenticated with check (created_by = (select auth.uid()));
create policy "update own or admin" on public.meal_templates
  for update to authenticated
  using (created_by = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or app.is_admin());
create policy "delete own or admin" on public.meal_templates
  for delete to authenticated using (created_by = (select auth.uid()) or app.is_admin());

-- ---------------------------------------------------------------------------
-- food_items  (Base44: FoodItem)
-- is_approved did not exist as a field but WAS referenced by Base44 RLS
-- (shared/global food database rows); materialized here (default false).
-- ---------------------------------------------------------------------------
create table public.food_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text,
  serving_size numeric(8, 2),
  serving_unit text,
  calories numeric(7, 1),
  protein numeric(6, 1),
  carbs numeric(6, 1),
  fats numeric(6, 1),
  fiber numeric(6, 1),
  sugar numeric(6, 1),
  category text check (category in
    ('Protein', 'Carbs', 'Fats', 'Vegetables', 'Dairy', 'Fruits', 'Other')),
  is_custom boolean not null default false,
  coach_id uuid references public.profiles (id) on delete cascade,
  description text,
  is_approved boolean not null default false,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.food_items enable row level security;
select app.add_updated_at_trigger('public.food_items');
create index food_items_created_by_idx on public.food_items (created_by);

create policy "select own or approved or admin" on public.food_items
  for select to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid())
         or is_approved or app.is_admin());
create policy "insert own" on public.food_items
  for insert to authenticated with check (created_by = (select auth.uid()) and (coach_id is null or coach_id = (select auth.uid())));
create policy "update own or admin" on public.food_items
  for update to authenticated
  using (created_by = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or app.is_admin());
create policy "delete own or admin" on public.food_items
  for delete to authenticated using (created_by = (select auth.uid()) or app.is_admin());

-- ---------------------------------------------------------------------------
-- food_logs  (Base44: FoodLog)
-- ---------------------------------------------------------------------------
create table public.food_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  nutrition_plan_id uuid references public.nutrition_plans (id) on delete set null,
  logged_date date not null,
  meal_name text,
  food_item_id uuid references public.food_items (id) on delete set null,
  food_name text, -- denormalized on purpose: survives food_item deletion
  serving_quantity numeric(8, 2),
  serving_unit text,
  calories numeric(7, 1),
  protein numeric(6, 1),
  carbs numeric(6, 1),
  fats numeric(6, 1),
  notes text,
  logged_by text not null default 'coach' check (logged_by in ('client', 'coach')),
  coach_daily_notes text, -- sentinel-row convention carried over from Base44
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.food_logs enable row level security;
select app.add_updated_at_trigger('public.food_logs');
create index food_logs_client_date_idx on public.food_logs (client_id, logged_date);

create policy "select coach or portal or admin" on public.food_logs
  for select to authenticated
  using (created_by = (select auth.uid()) or app.owns_client(client_id)
         or app.is_portal_client(client_id) or app.is_admin());
create policy "insert coach or portal" on public.food_logs
  for insert to authenticated
  with check (app.owns_client(client_id) or app.is_portal_client(client_id) or app.is_admin());
create policy "update coach or portal or admin" on public.food_logs
  for update to authenticated
  using (created_by = (select auth.uid()) or app.owns_client(client_id)
         or app.is_portal_client(client_id) or app.is_admin())
  with check (app.owns_client(client_id) or app.is_portal_client(client_id) or app.is_admin());
create policy "delete coach or portal or admin" on public.food_logs
  for delete to authenticated
  using (created_by = (select auth.uid()) or app.owns_client(client_id)
         or app.is_portal_client(client_id) or app.is_admin());

-- ---------------------------------------------------------------------------
-- check_in_forms  (Base44: CheckInForm)
-- questions / settings stay jsonb (form-builder documents).
-- assigned_client_ids: uuid[] of clients (no array FKs in Postgres).
-- ---------------------------------------------------------------------------
create table public.check_in_forms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  frequency text not null default 'weekly'
    check (frequency in ('daily', 'weekly', 'bi_weekly', 'monthly', 'custom')),
  due_day smallint check (due_day between 0 and 6),
  reminder_hours_before integer not null default 24,
  questions jsonb not null default '[]',
  settings jsonb not null default '{}',
  assign_to text not null default 'all' check (assign_to in ('all', 'specific')),
  assigned_client_ids uuid[] not null default '{}',
  is_active boolean not null default true,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.check_in_forms enable row level security;
select app.add_updated_at_trigger('public.check_in_forms');
create index check_in_forms_created_by_idx on public.check_in_forms (created_by);

-- Portal read is an ADDITION vs Base44 (which had no client read path and
-- relied on server-side fetches): clients may read active forms assigned to
-- them or published to all of their coach's clients.
create policy "select own or assigned portal or admin" on public.check_in_forms
  for select to authenticated
  using (
    created_by = (select auth.uid())
    or app.is_admin()
    or (is_active and (
          exists (select 1 from unnest(assigned_client_ids) cid where app.is_portal_client(cid))
          or (assign_to = 'all' and app.portal_coach_is(created_by))
        ))
  );
create policy "insert own" on public.check_in_forms
  for insert to authenticated with check (created_by = (select auth.uid()));
create policy "update own or admin" on public.check_in_forms
  for update to authenticated
  using (created_by = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or app.is_admin());
create policy "delete own or admin" on public.check_in_forms
  for delete to authenticated using (created_by = (select auth.uid()) or app.is_admin());

-- ---------------------------------------------------------------------------
-- check_ins  (Base44: CheckIn)
-- NOTE: internal_notes ("not visible to client") is NOT protected by
-- row-level security — same exposure existed in Base44. Flagged as an open
-- question (needs a column split or a portal view) in SCHEMA_MIGRATION.md.
-- ---------------------------------------------------------------------------
create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  client_name text,
  date date not null,
  review_status text not null default 'pending'
    check (review_status in ('pending', 'reviewed', 'flagged')),
  weight numeric(6, 2),
  body_fat_pct numeric(4, 1),
  measurements jsonb,
  photo_urls text[] not null default '{}',
  mood text check (mood in ('great', 'good', 'okay', 'tired', 'stressed')),
  energy_level smallint check (energy_level between 1 and 10),
  stress_level smallint check (stress_level between 1 and 10),
  sleep_hours numeric(4, 1),
  compliance_training numeric(5, 2) check (compliance_training between 0 and 100),
  compliance_nutrition numeric(5, 2) check (compliance_nutrition between 0 and 100),
  notes text,
  coach_notes text,
  internal_notes text,
  coach_responded boolean not null default false,
  ai_summary jsonb,
  form_id uuid references public.check_in_forms (id) on delete set null,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.check_ins enable row level security;
select app.add_updated_at_trigger('public.check_ins');
create index check_ins_client_date_idx on public.check_ins (client_id, date);
create index check_ins_review_status_idx on public.check_ins (review_status);

create policy "select coach or portal or admin" on public.check_ins
  for select to authenticated
  using (created_by = (select auth.uid()) or app.owns_client(client_id)
         or app.is_portal_client(client_id) or app.is_admin());
create policy "insert coach or portal" on public.check_ins
  for insert to authenticated
  with check (app.owns_client(client_id) or app.is_portal_client(client_id) or app.is_admin());
create policy "update coach or portal or admin" on public.check_ins
  for update to authenticated
  using (created_by = (select auth.uid()) or app.owns_client(client_id)
         or app.is_portal_client(client_id) or app.is_admin())
  with check (app.owns_client(client_id) or app.is_portal_client(client_id) or app.is_admin());
create policy "delete coach or portal or admin" on public.check_ins
  for delete to authenticated
  using (created_by = (select auth.uid()) or app.owns_client(client_id)
         or app.is_portal_client(client_id) or app.is_admin());

-- ---------------------------------------------------------------------------
-- daily_logs  (Base44: DailyLog)
-- ---------------------------------------------------------------------------
create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  date date not null,
  workout_done boolean not null default false,
  meals_logged integer not null default 0,
  water_glasses numeric(4, 1) not null default 0,
  steps integer not null default 0,
  habits_completed text[] not null default '{}', -- ids/names, loose in source
  focus_tasks jsonb not null default '[]',
  win_of_day text,
  mindset_score smallint check (mindset_score between 1 and 5),
  streak_days integer not null default 0,
  description text,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.daily_logs enable row level security;
select app.add_updated_at_trigger('public.daily_logs');
create index daily_logs_client_date_idx on public.daily_logs (client_id, date);

create policy "select coach or portal or admin" on public.daily_logs
  for select to authenticated
  using (created_by = (select auth.uid()) or app.owns_client(client_id)
         or app.is_portal_client(client_id) or app.is_admin());
create policy "insert coach or portal" on public.daily_logs
  for insert to authenticated
  with check (app.owns_client(client_id) or app.is_portal_client(client_id) or app.is_admin());
create policy "update coach or portal or admin" on public.daily_logs
  for update to authenticated
  using (created_by = (select auth.uid()) or app.owns_client(client_id)
         or app.is_portal_client(client_id) or app.is_admin())
  with check (app.owns_client(client_id) or app.is_portal_client(client_id) or app.is_admin());
create policy "delete coach or portal or admin" on public.daily_logs
  for delete to authenticated
  using (created_by = (select auth.uid()) or app.owns_client(client_id)
         or app.is_portal_client(client_id) or app.is_admin());

-- ---------------------------------------------------------------------------
-- weigh_ins  (Base44: WeighIn) — coach-entered weight trend.
-- Base44 gave NO client access here (unlike check_ins); preserved as-is.
-- ---------------------------------------------------------------------------
create table public.weigh_ins (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  team_id uuid references public.teams (id) on delete set null,
  weight numeric(6, 2) not null,
  date date not null,
  note text,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.weigh_ins enable row level security;
select app.add_updated_at_trigger('public.weigh_ins');
create index weigh_ins_client_date_idx on public.weigh_ins (client_id, date);
create index weigh_ins_team_id_idx on public.weigh_ins (team_id);

create policy "select own or team or admin" on public.weigh_ins
  for select to authenticated
  using (created_by = (select auth.uid()) or app.is_team_member(team_id) or app.is_admin());
create policy "insert own" on public.weigh_ins
  for insert to authenticated with check ((app.owns_client(client_id) and (team_id is null or app.is_team_member(team_id))) or app.is_admin());
create policy "update own or team or admin" on public.weigh_ins
  for update to authenticated
  using (created_by = (select auth.uid()) or app.is_team_member(team_id) or app.is_admin())
  with check ((app.owns_client(client_id) and (team_id is null or app.is_team_member(team_id))) or app.is_admin());
create policy "delete own or team or admin" on public.weigh_ins
  for delete to authenticated
  using (created_by = (select auth.uid()) or app.is_team_member(team_id) or app.is_admin());

-- ---------------------------------------------------------------------------
-- in_body_scans  (Base44: InBodyScan)
-- ---------------------------------------------------------------------------
create table public.in_body_scans (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  client_name text,
  scan_date date not null,
  weight_lbs numeric(6, 2),
  body_fat_percent numeric(4, 1),
  fat_mass_lbs numeric(6, 2),
  lean_mass_lbs numeric(6, 2),
  muscle_mass_lbs numeric(6, 2),
  bmi numeric(4, 1),
  bmr numeric(6, 0),
  visceral_fat_level numeric(4, 1),
  total_body_water numeric(6, 2),
  protein_kg numeric(5, 2),
  minerals_kg numeric(5, 2),
  inbody_score numeric(4, 0),
  right_arm_muscle numeric(5, 2),
  left_arm_muscle numeric(5, 2),
  trunk_muscle numeric(5, 2),
  right_leg_muscle numeric(5, 2),
  left_leg_muscle numeric(5, 2),
  right_arm_fat numeric(5, 2),
  left_arm_fat numeric(5, 2),
  trunk_fat numeric(5, 2),
  right_leg_fat numeric(5, 2),
  left_leg_fat numeric(5, 2),
  raw_scan_url text,
  notes text,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.in_body_scans enable row level security;
select app.add_updated_at_trigger('public.in_body_scans');
create index in_body_scans_client_date_idx on public.in_body_scans (client_id, scan_date);

create policy "select coach or portal or admin" on public.in_body_scans
  for select to authenticated
  using (created_by = (select auth.uid()) or app.owns_client(client_id)
         or app.is_portal_client(client_id) or app.is_admin());
create policy "insert coach or portal" on public.in_body_scans
  for insert to authenticated
  with check (app.owns_client(client_id) or app.is_portal_client(client_id) or app.is_admin());
create policy "update coach or portal or admin" on public.in_body_scans
  for update to authenticated
  using (created_by = (select auth.uid()) or app.owns_client(client_id)
         or app.is_portal_client(client_id) or app.is_admin())
  with check (app.owns_client(client_id) or app.is_portal_client(client_id) or app.is_admin());
create policy "delete coach or portal or admin" on public.in_body_scans
  for delete to authenticated
  using (created_by = (select auth.uid()) or app.owns_client(client_id)
         or app.is_portal_client(client_id) or app.is_admin());

-- ---------------------------------------------------------------------------
-- habits + habit_completions  (Base44: Habit, HabitCompletion)
-- Portal select (habits) and select/insert/update (completions) are
-- ADDITIONS vs the literal Base44 rules, which only worked for clients via
-- the created_by loophole (any signed-in user could create rows). Flagged.
-- ---------------------------------------------------------------------------
create table public.habits (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  team_id uuid references public.teams (id) on delete set null,
  name text not null,
  emoji text,
  frequency text not null default 'daily' check (frequency in ('daily', 'custom')),
  days_of_week smallint[] not null default '{}',
  is_active boolean not null default true,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.habits enable row level security;
select app.add_updated_at_trigger('public.habits');
create index habits_client_id_idx on public.habits (client_id);
create index habits_team_id_idx on public.habits (team_id);

create policy "select own or team or portal or admin" on public.habits
  for select to authenticated
  using (created_by = (select auth.uid()) or app.is_team_member(team_id)
         or app.is_portal_client(client_id) or app.is_admin());
create policy "insert own" on public.habits
  for insert to authenticated with check ((app.owns_client(client_id) and (team_id is null or app.is_team_member(team_id))) or app.is_admin());
create policy "update own or team or admin" on public.habits
  for update to authenticated
  using (created_by = (select auth.uid()) or app.is_team_member(team_id) or app.is_admin())
  with check ((app.owns_client(client_id) and (team_id is null or app.is_team_member(team_id))) or app.is_admin());
create policy "delete own or team or admin" on public.habits
  for delete to authenticated
  using (created_by = (select auth.uid()) or app.is_team_member(team_id) or app.is_admin());

create table public.habit_completions (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  team_id uuid references public.teams (id) on delete set null,
  date date not null,
  completed boolean not null default true,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (habit_id, date)
);

alter table public.habit_completions enable row level security;
select app.add_updated_at_trigger('public.habit_completions');
create index habit_completions_client_date_idx on public.habit_completions (client_id, date);

create policy "select own or team or portal or admin" on public.habit_completions
  for select to authenticated
  using (created_by = (select auth.uid()) or app.is_team_member(team_id)
         or app.is_portal_client(client_id) or app.is_admin());
create policy "insert own or portal" on public.habit_completions
  for insert to authenticated
  with check ((app.owns_client(client_id) and (team_id is null or app.is_team_member(team_id))) or app.is_portal_client(client_id) or app.is_admin());
create policy "update own or team or portal or admin" on public.habit_completions
  for update to authenticated
  using (created_by = (select auth.uid()) or app.is_team_member(team_id)
         or app.is_portal_client(client_id) or app.is_admin())
  with check ((app.owns_client(client_id) and (team_id is null or app.is_team_member(team_id))) or app.is_portal_client(client_id) or app.is_admin());
create policy "delete own or team or admin" on public.habit_completions
  for delete to authenticated
  using (created_by = (select auth.uid()) or app.is_team_member(team_id) or app.is_admin());

-- ---------------------------------------------------------------------------
-- goals + goal_templates  (Base44: Goal, GoalTemplate)
-- Portal select on goals is an ADDITION (flagged).
-- ---------------------------------------------------------------------------
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  team_id uuid references public.teams (id) on delete set null,
  name text not null,
  goal_type text not null check (goal_type in ('numeric', 'nutrition', 'simple')),
  due_date date,
  target_value numeric(10, 2),
  current_value numeric(10, 2),
  unit text,
  progress_pct numeric(5, 2) check (progress_pct between 0 and 100),
  calories_target numeric(7, 1),
  protein_target numeric(6, 1),
  carbs_target numeric(6, 1),
  fat_target numeric(6, 1),
  calories_current numeric(7, 1),
  protein_current numeric(6, 1),
  carbs_current numeric(6, 1),
  fat_current numeric(6, 1),
  notes text,
  status text not null default 'active' check (status in ('active', 'completed')),
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.goals enable row level security;
select app.add_updated_at_trigger('public.goals');
create index goals_client_id_idx on public.goals (client_id);
create index goals_team_id_idx on public.goals (team_id);

create policy "select own or team or portal or admin" on public.goals
  for select to authenticated
  using (created_by = (select auth.uid()) or app.is_team_member(team_id)
         or app.is_portal_client(client_id) or app.is_admin());
create policy "insert own" on public.goals
  for insert to authenticated with check ((app.owns_client(client_id) and (team_id is null or app.is_team_member(team_id))) or app.is_admin());
create policy "update own or team or admin" on public.goals
  for update to authenticated
  using (created_by = (select auth.uid()) or app.is_team_member(team_id) or app.is_admin())
  with check ((app.owns_client(client_id) and (team_id is null or app.is_team_member(team_id))) or app.is_admin());
create policy "delete own or team or admin" on public.goals
  for delete to authenticated
  using (created_by = (select auth.uid()) or app.is_team_member(team_id) or app.is_admin());

create table public.goal_templates (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  goal_type text not null check (goal_type in ('numeric', 'nutrition', 'simple')),
  target_value numeric(10, 2),
  unit text,
  calories_target numeric(7, 1),
  protein_target numeric(6, 1),
  carbs_target numeric(6, 1),
  fat_target numeric(6, 1),
  notes text,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.goal_templates enable row level security;
select app.add_updated_at_trigger('public.goal_templates');
create index goal_templates_coach_id_idx on public.goal_templates (coach_id);

create policy "select own or admin" on public.goal_templates
  for select to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "insert own" on public.goal_templates
  for insert to authenticated with check (created_by = (select auth.uid()) and coach_id = (select auth.uid()));
create policy "update own or admin" on public.goal_templates
  for update to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "delete own or admin" on public.goal_templates
  for delete to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());

-- ---------------------------------------------------------------------------
-- supplement_library  (Base44: SupplementLibrary)
-- update/delete were ADMIN-ONLY in Base44 (preset-managed library); preserved.
-- is_public materialized (referenced by Base44 RLS, not in the field list).
-- ---------------------------------------------------------------------------
create table public.supplement_library (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default 'supplement' check (category in
    ('supplement', 'vitamin', 'mineral', 'electrolyte', 'herb', 'other')),
  default_dosage text,
  default_timing text,
  purpose text,
  notes text,
  is_preset boolean not null default false,
  is_public boolean not null default false,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.supplement_library enable row level security;
select app.add_updated_at_trigger('public.supplement_library');

create policy "select own or public or admin" on public.supplement_library
  for select to authenticated
  using (created_by = (select auth.uid()) or is_public or app.is_admin());
create policy "insert own" on public.supplement_library
  for insert to authenticated with check (created_by = (select auth.uid()));
create policy "update admin" on public.supplement_library
  for update to authenticated using (app.is_admin()) with check (app.is_admin());
create policy "delete admin" on public.supplement_library
  for delete to authenticated using (app.is_admin());

-- ---------------------------------------------------------------------------
-- messages  (Base44: Message) — coach <-> client thread
-- ---------------------------------------------------------------------------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  team_id uuid references public.teams (id) on delete set null,
  client_name text,
  sender text not null default 'coach' check (sender in ('coach', 'client')),
  content text not null default '', -- empty string for voice/video messages
  is_read boolean not null default false,
  tag text check (tag in ('check_in', 'urgent', 'nutrition', 'training', 'motivation', 'general')),
  is_pinned boolean not null default false,
  is_broadcast boolean not null default false,
  media_type text not null default 'text' check (media_type in ('text', 'voice', 'video')),
  media_url text,
  duration_seconds numeric(8, 1),
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.messages enable row level security;
select app.add_updated_at_trigger('public.messages');
create index messages_client_id_created_idx on public.messages (client_id, created_at);
create index messages_team_id_idx on public.messages (team_id);

create policy "select coach or team or portal or admin" on public.messages
  for select to authenticated
  using (created_by = (select auth.uid()) or app.owns_client(client_id)
         or app.is_team_member(team_id) or app.is_portal_client(client_id) or app.is_admin());
create policy "insert coach or portal" on public.messages
  for insert to authenticated
  with check ((app.owns_client(client_id) and (team_id is null or app.is_team_member(team_id))) or app.is_portal_client(client_id) or app.is_admin());
create policy "update coach or portal or admin" on public.messages
  for update to authenticated
  using (created_by = (select auth.uid()) or app.owns_client(client_id)
         or app.is_portal_client(client_id) or app.is_admin())
  with check (app.owns_client(client_id) or app.is_portal_client(client_id) or app.is_admin());
create policy "delete own or admin" on public.messages
  for delete to authenticated
  using (created_by = (select auth.uid()) or app.is_admin());

-- ---------------------------------------------------------------------------
-- coaching_sessions  (Base44: Session — renamed to avoid clashing with the
-- authentication concept of a "session")
-- ---------------------------------------------------------------------------
create table public.coaching_sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  client_name text,
  title text not null,
  date date not null,
  time time,
  end_time time,
  duration_minutes integer not null default 60,
  type text not null default 'video_call' check (type in
    ('video_call', 'in_person', 'check_in', 'consultation', 'strategy', 'assessment', 'custom')),
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes text,
  meeting_link text,
  google_event_id text,
  zoom_meeting_id text,
  zoom_join_url text,
  zoom_start_url text,
  zoom_password text,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.coaching_sessions enable row level security;
select app.add_updated_at_trigger('public.coaching_sessions');
create index coaching_sessions_client_id_idx on public.coaching_sessions (client_id);
create index coaching_sessions_date_idx on public.coaching_sessions (date);

create policy "select coach or portal or admin" on public.coaching_sessions
  for select to authenticated
  using (created_by = (select auth.uid()) or app.owns_client(client_id)
         or app.is_portal_client(client_id) or app.is_admin());
create policy "insert own" on public.coaching_sessions
  for insert to authenticated with check (app.owns_client(client_id) or app.is_admin());
create policy "update own or admin" on public.coaching_sessions
  for update to authenticated
  using (created_by = (select auth.uid()) or app.owns_client(client_id) or app.is_admin())
  with check (created_by = (select auth.uid()) or app.owns_client(client_id) or app.is_admin());
create policy "delete own or admin" on public.coaching_sessions
  for delete to authenticated
  using (created_by = (select auth.uid()) or app.owns_client(client_id) or app.is_admin());

-- ---------------------------------------------------------------------------
-- blocked_times / buffer_times / coach_availability  (scheduling config)
-- Base44 documented coach_id as "coach email/ID" — normalized to uuid here;
-- the data migration must resolve emails to profile ids (flagged).
-- ---------------------------------------------------------------------------
create table public.blocked_times (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  date date not null,
  start_time time not null,
  end_time time not null,
  type text not null default 'personal'
    check (type in ('personal', 'lunch', 'admin', 'vacation', 'other')),
  title text,
  description text,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.blocked_times enable row level security;
select app.add_updated_at_trigger('public.blocked_times');
create index blocked_times_coach_date_idx on public.blocked_times (coach_id, date);

create policy "select own or admin" on public.blocked_times
  for select to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "insert own" on public.blocked_times
  for insert to authenticated with check (created_by = (select auth.uid()) and coach_id = (select auth.uid()));
create policy "update own or admin" on public.blocked_times
  for update to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "delete own or admin" on public.blocked_times
  for delete to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());

create table public.buffer_times (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  minutes smallint not null default 0 check (minutes in (0, 5, 10, 15, 30)),
  description text,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (coach_id)
);

alter table public.buffer_times enable row level security;
select app.add_updated_at_trigger('public.buffer_times');

create policy "select own or admin" on public.buffer_times
  for select to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "insert own" on public.buffer_times
  for insert to authenticated with check (created_by = (select auth.uid()) and coach_id = (select auth.uid()));
create policy "update own or admin" on public.buffer_times
  for update to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "delete admin" on public.buffer_times
  for delete to authenticated using (app.is_admin());

create table public.coach_availability (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  time_blocks jsonb not null default '[]',
  timezone text not null default 'America/New_York',
  description text,
  is_public boolean not null default false, -- referenced by Base44 RLS, materialized
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (coach_id, day_of_week)
);

alter table public.coach_availability enable row level security;
select app.add_updated_at_trigger('public.coach_availability');

-- anon included so public booking pages can read published availability
create policy "select own or public or admin" on public.coach_availability
  for select to anon, authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid())
         or is_public or app.is_admin());
create policy "insert own" on public.coach_availability
  for insert to authenticated with check (created_by = (select auth.uid()) and coach_id = (select auth.uid()));
create policy "update own or admin" on public.coach_availability
  for update to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "delete admin" on public.coach_availability
  for delete to authenticated using (app.is_admin());

-- ---------------------------------------------------------------------------
-- onboarding_responses  (Base44: OnboardingResponse)
-- Base44 create rule was `null` — intake submissions are created server-side
-- (submitOnboardingIntake). NO insert policy on purpose: only the service
-- role writes rows (public intake form goes through an edge function).
-- coach_id was "user ID / email" in Base44 — normalized to uuid (flagged).
-- ---------------------------------------------------------------------------
create table public.onboarding_responses (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients (id) on delete set null,
  coach_id uuid references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'completed', 'converted')),
  name text not null,
  email text not null,
  phone text,
  age smallint,
  current_weight numeric(6, 2),
  height text,
  goal text check (goal in
    ('fat_loss', 'muscle_gain', 'hybrid', 'strength', 'endurance', 'general_fitness')),
  activity_level text check (activity_level in
    ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'athlete')),
  training_days_per_week smallint,
  food_preferences text,
  schedule_preferences text,
  health_conditions text,
  motivation text,
  previous_experience text check (previous_experience in
    ('none', 'beginner', 'some', 'experienced', 'advanced')),
  description text,
  created_by uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.onboarding_responses enable row level security;
select app.add_updated_at_trigger('public.onboarding_responses');
create index onboarding_responses_coach_id_idx on public.onboarding_responses (coach_id);

create policy "select coach or admin" on public.onboarding_responses
  for select to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "update coach or admin" on public.onboarding_responses
  for update to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "delete admin" on public.onboarding_responses
  for delete to authenticated using (app.is_admin());
