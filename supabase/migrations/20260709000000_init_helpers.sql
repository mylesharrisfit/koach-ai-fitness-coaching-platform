-- ============================================================================
-- Migration 0 — extensions, app schema, table-independent helpers
--
-- Conventions used across all migrations in this port:
--   * Base44 built-ins map as:  id -> id uuid pk,  created_date -> created_at,
--     updated_date -> updated_at,  created_by_id -> created_by uuid.
--   * Base44 "string" ids become uuid; "date-time" -> timestamptz;
--     "date" -> date; "HH:MM" strings -> time; money -> numeric(12,2);
--     enums -> text + CHECK; arrays of objects / free objects -> jsonb.
--   * Every table: RLS ENABLED, default-deny (no access without a policy).
--   * "admin" = profiles.role = 'admin' (platform staff), checked via
--     app.is_admin(); it is folded into each policy rather than a bypass.
--   * Client-portal access (invite-token users) is granted through
--     app.is_portal_client(client_id) — see 20260709000100_core.sql and
--     SCHEMA_MIGRATION.md ("Invite-token portal RLS") for the full design.
-- ============================================================================

create extension if not exists pgcrypto;

create schema if not exists app;
grant usage on schema app to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- updated_at maintenance (attached to every table via trigger)
-- ---------------------------------------------------------------------------
create or replace function app.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Attach the standard timestamps trigger to a table (used by later migrations)
create or replace function app.add_updated_at_trigger(target regclass)
returns void
language plpgsql
as $$
begin
  execute format(
    'create trigger set_updated_at before update on %s
       for each row execute function app.set_updated_at()',
    target);
end;
$$;

-- ---------------------------------------------------------------------------
-- Portal claim reader.
--
-- The client portal is authenticated by exchanging a Client.invite_token for
-- a short-lived JWT minted by an edge function (Step 4/5 of the migration).
-- That JWT carries role=authenticated and a custom `portal_client_id` claim
-- (top-level or under app_metadata). This function extracts it; RLS policies
-- never read the invite token itself.
-- ---------------------------------------------------------------------------
create or replace function app.portal_client_id()
returns uuid
language sql
stable
as $$
  select nullif(
    coalesce(
      auth.jwt() -> 'app_metadata' ->> 'portal_client_id',
      auth.jwt() ->> 'portal_client_id'
    ), ''
  )::uuid;
$$;
