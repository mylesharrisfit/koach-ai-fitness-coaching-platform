-- ============================================================================
-- Migration 7 (Step 1.5, Fix 2) — column-level privacy for coach-only
-- columns that portal clients could previously read via row-level SELECT:
--   * check_ins.internal_notes            ("not visible to client")
--   * coaching_sessions.zoom_meeting_id / zoom_join_url / zoom_start_url /
--     zoom_password                        (host credentials)
--
-- Design note — why the views are NOT security_invoker, and why there is no
-- table-level REVOKE: coaches and portal clients share the single
-- `authenticated` role, so role-level REVOKE/column grants cannot separate
-- them (revoking from `authenticated` would blind coaches too), and a
-- security_invoker view would need the base-table portal SELECT policies to
-- keep existing — leaving the direct base-table read hole open. Instead:
--
--   1. The portal paths are REMOVED from the base-table policies of
--      check_ins (all ops) and coaching_sessions (select). Coach-facing
--      policies are unchanged — coaches keep full-column access to the base
--      tables exactly as before.
--   2. Portal I/O moves to dedicated views (naming convention:
--      <table>_portal_view) that expose every column EXCEPT the coach-only
--      ones. The views are owned by the migration role (definer semantics:
--      the owner bypasses base RLS), carry their own
--      `where app.is_portal_client(client_id)` filter — the same predicate
--      the base policies used — plus WITH CASCADED CHECK OPTION so writes
--      through the view cannot target another client's rows, and
--      security_barrier = true so user-supplied predicates cannot leak
--      filtered rows.
--   3. check_ins_portal_view is auto-updatable: portal clients keep the
--      CRUD access Base44 gave them (insert/update/delete their own
--      check-ins), minus the internal_notes column, which is not writable
--      or readable through the view. coaching_sessions_portal_view is
--      read-only (Base44 gave portal clients select only).
--
-- Reversal: drop the two views, recreate the previous portal-inclusive
-- policies (see 20260709000200_coaching.sql history).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. check_ins: portal paths off the base table
-- ---------------------------------------------------------------------------
drop policy "select coach or portal or admin" on public.check_ins;
drop policy "insert coach or portal" on public.check_ins;
drop policy "update coach or portal or admin" on public.check_ins;
drop policy "delete coach or portal or admin" on public.check_ins;

create policy "select coach or admin" on public.check_ins
  for select to authenticated
  using (created_by = (select auth.uid()) or app.owns_client(client_id) or app.is_admin());
create policy "insert coach" on public.check_ins
  for insert to authenticated
  with check (app.owns_client(client_id) or app.is_admin());
create policy "update coach or admin" on public.check_ins
  for update to authenticated
  using (created_by = (select auth.uid()) or app.owns_client(client_id) or app.is_admin())
  with check (app.owns_client(client_id) or app.is_admin());
create policy "delete coach or admin" on public.check_ins
  for delete to authenticated
  using (created_by = (select auth.uid()) or app.owns_client(client_id) or app.is_admin());

-- ---------------------------------------------------------------------------
-- 2. coaching_sessions: portal path off the base-table select
--    (insert/update/delete were already coach-only)
-- ---------------------------------------------------------------------------
drop policy "select coach or portal or admin" on public.coaching_sessions;

create policy "select coach or admin" on public.coaching_sessions
  for select to authenticated
  using (created_by = (select auth.uid()) or app.owns_client(client_id) or app.is_admin());

-- ---------------------------------------------------------------------------
-- 3. Portal views (naming convention: <table>_portal_view)
-- ---------------------------------------------------------------------------

-- Every check_ins column EXCEPT internal_notes. Auto-updatable single-table
-- view: portal CRUD flows through here.
create view public.check_ins_portal_view
with (security_barrier = true, security_invoker = false)
as
select
  id, client_id, client_name, date, review_status, weight, body_fat_pct,
  measurements, photo_urls, mood, energy_level, stress_level, sleep_hours,
  compliance_training, compliance_nutrition, notes, coach_notes,
  coach_responded, ai_summary, form_id, created_by, created_at, updated_at
from public.check_ins
where app.is_portal_client(client_id)
with cascaded check option;

comment on view public.check_ins_portal_view is
  'Portal-client CRUD surface for check_ins: own rows only, internal_notes excluded. Coaches keep using the base table.';

-- Every coaching_sessions column EXCEPT zoom_meeting_id / zoom_join_url /
-- zoom_start_url / zoom_password. meeting_link (the client-facing join
-- link) stays. Read-only for the portal.
create view public.coaching_sessions_portal_view
with (security_barrier = true, security_invoker = false)
as
select
  id, client_id, client_name, title, date, time, end_time, duration_minutes,
  type, status, notes, meeting_link, google_event_id,
  created_by, created_at, updated_at
from public.coaching_sessions
where app.is_portal_client(client_id);

comment on view public.coaching_sessions_portal_view is
  'Portal-client read surface for coaching_sessions: own rows only, zoom_* host credentials excluded. Coaches keep using the base table.';

-- ---------------------------------------------------------------------------
-- 4. Grants: portal traffic is `authenticated` (claim JWT); nothing for anon.
-- ---------------------------------------------------------------------------
revoke all on public.check_ins_portal_view from anon;
revoke all on public.coaching_sessions_portal_view from anon;

grant select, insert, update, delete on public.check_ins_portal_view to authenticated;
grant select on public.coaching_sessions_portal_view to authenticated;
