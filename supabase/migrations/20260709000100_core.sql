-- ============================================================================
-- Migration 1 — CORE: profiles (Base44 User), teams, team_members, clients
-- plus the tenancy helper functions every later policy depends on.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- profiles  (Base44 entity: User)
-- One row per auth.users row. Coaches and platform admins live here; portal
-- clients get a row too once real client auth lands (Step 3).
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('admin', 'user')),
  subscription_tier text not null default 'starter'
    check (subscription_tier in ('starter', 'pro', 'elite', 'enterprise')),
  billing_status text not null default 'active'
    check (billing_status in ('active', 'past_due', 'canceled', 'trialing', 'unpaid', 'incomplete')),
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  subscription_renewal_date date,
  subscription_cancel_at_period_end boolean not null default false,
  business_name text,
  bio text,
  website text,
  instagram text,
  specializations text,
  ai_generation_count integer not null default 0,
  ai_generation_month text, -- YYYY-MM window for the AI usage counter
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
select app.add_updated_at_trigger('public.profiles');

-- Auto-provision a profile for every new auth user
create or replace function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function app.handle_new_user();

-- Admin check used throughout. SECURITY DEFINER so it can read profiles
-- without recursing through profiles' own RLS.
create or replace function app.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- Privilege-escalation guard: normal users may edit their profile but not
-- their role or Stripe/subscription state. Service-role and admins may.
-- Deliberately INVOKER rights: with security definer, current_user would
-- resolve to the function owner and the allowlist below would always pass.
create or replace function app.protect_profile_privileged_columns()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_user in ('postgres', 'supabase_admin', 'supabase_auth_admin', 'service_role')
     or app.is_admin() then
    return new;
  end if;
  if new.role is distinct from old.role
     or new.subscription_tier is distinct from old.subscription_tier
     or new.billing_status is distinct from old.billing_status
     or new.stripe_customer_id is distinct from old.stripe_customer_id
     or new.stripe_subscription_id is distinct from old.stripe_subscription_id
     or new.stripe_price_id is distinct from old.stripe_price_id
     or new.subscription_renewal_date is distinct from old.subscription_renewal_date
     or new.subscription_cancel_at_period_end is distinct from old.subscription_cancel_at_period_end
  then
    raise exception 'not allowed to modify privileged profile columns';
  end if;
  return new;
end;
$$;

create trigger protect_profile_privileged_columns
  before update on public.profiles
  for each row execute function app.protect_profile_privileged_columns();

create policy "select own or admin" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or app.is_admin());

create policy "insert self" on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

create policy "update own or admin" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or app.is_admin())
  with check (id = (select auth.uid()) or app.is_admin());

-- no delete policy: profile rows are removed via auth.users cascade only.

-- ---------------------------------------------------------------------------
-- teams  (Base44 entity: Team)
-- ---------------------------------------------------------------------------
create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_coach_id uuid not null references public.profiles (id) on delete cascade,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.teams enable row level security;
select app.add_updated_at_trigger('public.teams');
create index teams_owner_coach_id_idx on public.teams (owner_coach_id);

-- ---------------------------------------------------------------------------
-- team_members  (Base44 entity: TeamMember)
-- user_id is null until the invited coach accepts.
-- ---------------------------------------------------------------------------
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete cascade,
  name text not null,
  email text not null,
  role_label text not null default 'coach' check (role_label in ('owner', 'coach')),
  invite_status text not null default 'pending' check (invite_status in ('pending', 'accepted')),
  invited_by uuid references public.profiles (id) on delete set null,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.team_members enable row level security;
select app.add_updated_at_trigger('public.team_members');
create unique index team_members_team_email_key on public.team_members (team_id, email);
create unique index team_members_team_user_key on public.team_members (team_id, user_id)
  where user_id is not null;
create index team_members_user_id_idx on public.team_members (user_id);

-- Team membership check. SECURITY DEFINER to avoid RLS recursion between
-- team_members and every team-scoped table. The team owner always counts.
create or replace function app.is_team_member(target_team uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select target_team is not null and (
    exists (
      select 1 from public.team_members tm
      where tm.team_id = target_team
        and tm.invite_status = 'accepted'
        and tm.user_id = auth.uid()
    )
    or exists (
      select 1 from public.teams t
      where t.id = target_team and t.owner_coach_id = auth.uid()
    )
  );
$$;

create policy "select member or owner or admin" on public.teams
  for select to authenticated
  using (
    owner_coach_id = (select auth.uid())
    or created_by = (select auth.uid())
    or app.is_team_member(id)
    or app.is_admin()
  );

create policy "insert own team" on public.teams
  for insert to authenticated
  with check (created_by = (select auth.uid()) and owner_coach_id = (select auth.uid()));

create policy "update owner or admin" on public.teams
  for update to authenticated
  using (owner_coach_id = (select auth.uid()) or app.is_admin())
  with check (owner_coach_id = (select auth.uid()) or app.is_admin());

create policy "delete admin" on public.teams
  for delete to authenticated
  using (app.is_admin());

create policy "select own membership or team" on public.team_members
  for select to authenticated
  using (
    created_by = (select auth.uid())
    or user_id = (select auth.uid())
    or email = (select auth.jwt() ->> 'email')
    or exists (select 1 from public.teams t
               where t.id = team_id and t.owner_coach_id = (select auth.uid()))
    or app.is_admin()
  );

-- Tightened vs Base44 (which allowed any authenticated user to insert):
-- only the team owner or an admin may add members.
create policy "insert by team owner or admin" on public.team_members
  for insert to authenticated
  with check (
    exists (select 1 from public.teams t
            where t.id = team_id and t.owner_coach_id = (select auth.uid()))
    or app.is_admin()
  );

create policy "update self or inviter or owner or admin" on public.team_members
  for update to authenticated
  using (
    created_by = (select auth.uid())
    or user_id = (select auth.uid())
    or email = (select auth.jwt() ->> 'email')
    or exists (select 1 from public.teams t
               where t.id = team_id and t.owner_coach_id = (select auth.uid()))
    or app.is_admin()
  )
  with check (
    created_by = (select auth.uid())
    or user_id = (select auth.uid())
    or email = (select auth.jwt() ->> 'email')
    or exists (select 1 from public.teams t
               where t.id = team_id and t.owner_coach_id = (select auth.uid()))
    or app.is_admin()
  );

create policy "delete inviter or owner or admin" on public.team_members
  for delete to authenticated
  using (
    created_by = (select auth.uid())
    or exists (select 1 from public.teams t
               where t.id = team_id and t.owner_coach_id = (select auth.uid()))
    or app.is_admin()
  );

-- ---------------------------------------------------------------------------
-- clients  (Base44 entity: Client)
-- user_id = owning coach (per Base44 docs), NOT the client's own login.
-- portal_user_id (new) = the client's future Supabase Auth identity (Step 3).
-- assigned_program_id / assigned_nutrition_id get their FKs in the coaching
-- migration, after those tables exist.
-- ---------------------------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade, -- owning coach
  team_id uuid references public.teams (id) on delete set null,
  portal_user_id uuid unique references auth.users (id) on delete set null,
  name text not null,
  email text not null,
  invite_token text unique,
  invite_token_expires timestamptz,
  phone text,
  avatar_url text,
  lifecycle_status text not null default 'lead'
    check (lifecycle_status in ('lead', 'active', 'at_risk', 'completed', 'alumni')),
  status text not null default 'active'
    check (status in ('active', 'inactive', 'prospect')), -- legacy field
  tags text[] not null default '{}',
  lifecycle_notes text,
  goal text not null default 'general_fitness'
    check (goal in ('weight_loss', 'muscle_gain', 'strength', 'endurance', 'flexibility', 'general_fitness')),
  start_date date,
  current_weight numeric(6, 2),
  starting_weight numeric(6, 2),
  target_weight numeric(6, 2),
  height text, -- free-form in source data (5'10" / 178cm)
  sex text check (sex in ('male', 'female', 'other', 'prefer_not_to_say')),
  date_of_birth date,
  notes text,
  external_id text,
  assigned_program_id uuid,
  assigned_nutrition_id uuid,
  monthly_rate numeric(12, 2),
  stripe_customer_id text,
  billing_status text not null default 'none'
    check (billing_status in ('active', 'past_due', 'cancelled', 'none')),
  description text,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.clients enable row level security;
select app.add_updated_at_trigger('public.clients');
create index clients_user_id_idx on public.clients (user_id);
create index clients_team_id_idx on public.clients (team_id);
create index clients_created_by_idx on public.clients (created_by);

-- ---------------------------------------------------------------------------
-- Tenancy helpers used by every client-scoped table.
-- ---------------------------------------------------------------------------

-- Coach-side: does the current user own (or co-coach via team) this client?
create or replace function app.owns_client(target_client uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select target_client is not null and exists (
    select 1 from public.clients c
    where c.id = target_client
      and (
        c.user_id = auth.uid()
        or c.created_by = auth.uid()
        or app.is_team_member(c.team_id)
      )
  );
$$;

-- Client-side: is the current requester this client? True either via the
-- portal JWT claim (invite-token exchange) or, post Step 3, via the linked
-- portal auth account.
create or replace function app.is_portal_client(target_client uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select target_client is not null and (
    target_client = app.portal_client_id()
    or exists (
      select 1 from public.clients c
      where c.id = target_client
        and c.portal_user_id is not null
        and c.portal_user_id = auth.uid()
    )
  );
$$;

-- Client-side: does the current portal client belong to the given coach?
-- (Used for coach-published resources the portal must read: check-in forms,
-- community posts, etc.)
create or replace function app.portal_coach_is(target_coach uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select target_coach is not null and exists (
    select 1 from public.clients c
    where (c.id = app.portal_client_id()
           or (c.portal_user_id is not null and c.portal_user_id = auth.uid()))
      and (c.user_id = target_coach or c.created_by = target_coach)
  );
$$;

create policy "select coach or team or portal self or admin" on public.clients
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or created_by = (select auth.uid())
    or app.is_team_member(team_id)
    or app.is_portal_client(id) -- portal client may read their own record
    or app.is_admin()
  );

create policy "insert own or admin" on public.clients
  for insert to authenticated
  with check (
    (created_by = (select auth.uid())
     and (user_id is null or user_id = (select auth.uid()) or app.is_team_member(team_id)))
    or app.is_admin()
  );

create policy "update coach or team or admin" on public.clients
  for update to authenticated
  using (
    user_id = (select auth.uid())
    or created_by = (select auth.uid())
    or app.is_team_member(team_id)
    or app.is_admin()
  )
  with check (
    user_id = (select auth.uid())
    or created_by = (select auth.uid())
    or app.is_team_member(team_id)
    or app.is_admin()
  );

create policy "delete coach or team or admin" on public.clients
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    or created_by = (select auth.uid())
    or app.is_team_member(team_id)
    or app.is_admin()
  );
