-- ============================================================================
-- Migration 12 (Step 6) — RBAC rebuild: real team roles + platform/team split.
--
-- PERMISSION MODEL (documented in SCHEMA_MIGRATION.md):
--
--   Platform level — profiles.role:
--     'user'  any coach (and future consumer) account. THE DEFAULT.
--     'admin' PLATFORM STAFF ONLY. app.is_admin() grants cross-tenant read in
--             many policies, so this flag must never be handed to a customer.
--             Base44's single-tenant app used role='admin' to mean "the
--             coach"; the migration script now maps that to 'user' (open
--             question 10) — platform admin is granted deliberately, after
--             migration, never imported.
--
--   Team level — team_members.role_label (+ teams.owner_coach_id):
--     'owner' full team control: manage members (invite/remove/change roles),
--             team settings, billing (billing rides on the owner's own
--             profiles row — already service-role-guarded). The founding
--             owner is teams.owner_coach_id; an accepted membership with
--             role_label='owner' is a CO-OWNER with the same team rights
--             (the Team page's "promote to owner" feature now actually
--             grants what it displays).
--     'coach' client work only: full access to team-scoped client data via
--             app.is_team_member() (clients, programs, check-ins, messages,
--             sessions, ...). NO member management, NO team settings, NO
--             billing.
--   A narrower 'assistant' tier was consciously NOT added: a sweep of the UI
--   found no surface that distinguishes one (the invite flow only creates
--   'coach'; every role gate is owner-vs-coach). app.team_role() makes adding
--   one later a constraint + policy tweak instead of a rebuild.
--
-- FIXES in this migration:
--   1. app.is_team_owner() / app.team_role() helpers.
--   2. Privilege-escalation holes in team_members self-UPDATE: a member
--      could update their OWN row (user_id = auth.uid() passed the policy)
--      and set role_label='owner' (self-promotion) or team_id=<any team>
--      (join an arbitrary team). A BEFORE UPDATE trigger now locks
--      role_label/team_id/created_by changes to team owners (role changes)
--      and service/platform-admin (team moves).
--   3. teams / team_members management policies extended from
--      "founding owner only" to app.is_team_owner() so co-owners can manage.
-- ============================================================================

-- --- 1. helpers --------------------------------------------------------------
create or replace function app.is_team_owner(target_team uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select target_team is not null and (
    exists (
      select 1 from public.teams t
      where t.id = target_team and t.owner_coach_id = auth.uid()
    )
    or exists (
      select 1 from public.team_members tm
      where tm.team_id = target_team
        and tm.invite_status = 'accepted'
        and tm.role_label = 'owner'
        and tm.user_id = auth.uid()
    )
  );
$$;

comment on function app.is_team_owner(uuid) is
  'Step 6: founding owner (teams.owner_coach_id) OR accepted co-owner membership (role_label=owner).';

-- The caller's role within a team: 'owner' | 'coach' | null (not a member).
create or replace function app.team_role(target_team uuid)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when app.is_team_owner(target_team) then 'owner'
    when exists (
      select 1 from public.team_members tm
      where tm.team_id = target_team
        and tm.invite_status = 'accepted'
        and tm.user_id = auth.uid()
    ) then 'coach'
    else null
  end;
$$;

comment on function app.team_role(uuid) is
  'Step 6: the caller''s effective team tier. Extend here (and the role_label CHECK) if a narrower tier is ever added.';

-- --- 2. close the self-promotion / team-move holes ---------------------------
-- Deliberately INVOKER rights (same convention as
-- app.protect_profile_privileged_columns): with security definer,
-- current_user would resolve to the function owner and the service allowlist
-- below would always pass.
create or replace function app.protect_team_member_role()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if current_user in ('postgres', 'supabase_admin', 'supabase_auth_admin', 'service_role')
     or app.is_admin() then
    return new;
  end if;

  -- Moving a membership row between teams is never a self-service operation.
  if new.team_id is distinct from old.team_id then
    raise exception 'team_members.team_id cannot be changed';
  end if;

  -- Role changes are reserved for team owners (and platform admins/service).
  if new.role_label is distinct from old.role_label
     and not app.is_team_owner(old.team_id) then
    raise exception 'only a team owner can change member roles';
  end if;

  -- Reassigning a row's identity binding to a DIFFERENT user is owner-only;
  -- the invite-acceptance path (null -> the caller's own uid) stays open.
  if new.user_id is distinct from old.user_id
     and not (old.user_id is null and new.user_id = auth.uid())
     and not app.is_team_owner(old.team_id) then
    raise exception 'only a team owner can rebind a membership';
  end if;

  return new;
end;
$$;

create trigger protect_team_member_role
  before update on public.team_members
  for each row execute function app.protect_team_member_role();

-- --- 3. management policies: founding owner -> any owner ----------------------
-- teams: co-owners may update team settings (delete stays platform-admin-only).
drop policy "update owner or admin" on public.teams;
create policy "update owner or admin" on public.teams
  for update to authenticated
  using (app.is_team_owner(id) or app.is_admin())
  with check (app.is_team_owner(id) or app.is_admin());

-- team_members: management actions honor co-owners via app.is_team_owner().
drop policy "select own membership or team" on public.team_members;
create policy "select own membership or team" on public.team_members
  for select to authenticated
  using (
    created_by = (select auth.uid())
    or user_id = (select auth.uid())
    or email = (select auth.jwt() ->> 'email')
    or app.is_team_member(team_id)   -- coaches can see their teammates
    or app.is_admin()
  );

drop policy "insert by team owner or admin" on public.team_members;
create policy "insert by team owner or admin" on public.team_members
  for insert to authenticated
  with check (app.is_team_owner(team_id) or app.is_admin());

drop policy "update self or inviter or owner or admin" on public.team_members;
-- Self-updates stay possible (invite acceptance: bind user_id, flip
-- invite_status) — the BEFORE trigger above pins role_label/team_id.
create policy "update self or owner or admin" on public.team_members
  for update to authenticated
  using (
    user_id = (select auth.uid())
    or email = (select auth.jwt() ->> 'email')
    or app.is_team_owner(team_id)
    or app.is_admin()
  )
  with check (
    user_id = (select auth.uid())
    or email = (select auth.jwt() ->> 'email')
    or app.is_team_owner(team_id)
    or app.is_admin()
  );

drop policy "delete inviter or owner or admin" on public.team_members;
create policy "delete owner or admin" on public.team_members
  for delete to authenticated
  using (app.is_team_owner(team_id) or app.is_admin());
