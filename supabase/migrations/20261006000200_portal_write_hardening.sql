-- Portal write hardening (smoke test 2026-10-05, items 7 + 12).
--
-- 1. check_ins: a portal client could INSERT (and, via the view grants, UPDATE /
--    DELETE) coach-only fields — review_status, coach_notes, coach_responded,
--    ai_summary — forging a "reviewed" check-in with a fake coach note.
-- 2. messages: a portal client could INSERT sender='coach' (rendered as the
--    coach in both portals) and, through the update policy, rewrite the content
--    of the coach's own messages in the thread.
--
-- The portal UI only ever inserts check-ins and only flips messages.is_read,
-- so those are the only portal writes left.
--
-- "Trusted" caller = the owning coach / team member, a platform admin, the
-- service role (edge functions, cron), or no end-user JWT at all (SQL run by
-- migrations / DB triggers).

create or replace function app.is_trusted_writer(target_client uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select auth.uid() is null
      or coalesce(auth.role(), '') = 'service_role'
      or app.owns_client(target_client)
      or app.is_admin();
$$;
revoke all on function app.is_trusted_writer(uuid) from public, anon;
grant execute on function app.is_trusted_writer(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------- check_ins --
create or replace function app.guard_checkin_portal_write()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'DELETE' then
    if not app.is_trusted_writer(old.client_id) then
      raise exception 'portal clients cannot delete check-ins' using errcode = '42501';
    end if;
    return old;
  end if;

  if app.is_trusted_writer(new.client_id) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.review_status   := 'pending';
    new.coach_notes     := null;
    new.coach_responded := false;
    new.ai_summary      := null;
    new.created_by      := auth.uid();
  else -- UPDATE: coach-owned fields are frozen for portal callers
    new.review_status   := old.review_status;
    new.coach_notes     := old.coach_notes;
    new.coach_responded := old.coach_responded;
    new.ai_summary      := old.ai_summary;
    new.client_id       := old.client_id;
    new.created_by      := old.created_by;
  end if;
  return new;
end;
$$;

drop trigger if exists guard_checkin_portal_write on public.check_ins;
create trigger guard_checkin_portal_write
  before insert or update or delete on public.check_ins
  for each row execute function app.guard_checkin_portal_write();

-- Portal check-ins are insert + read only (no UI path updates or deletes them).
revoke all on public.check_ins_portal_view from anon, authenticated;
grant select, insert on public.check_ins_portal_view to authenticated;

-- ----------------------------------------------------------------- messages --
create or replace function app.guard_message_portal_write()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if app.is_trusted_writer(coalesce(new.client_id, old.client_id)) then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.sender       := 'client';
    new.created_by   := auth.uid();
    new.is_broadcast := false;
    new.is_pinned    := false;
    new.is_read      := false;
    return new;
  end if;

  -- UPDATE by a portal client: only is_read may change.
  if (to_jsonb(new) - 'is_read' - 'updated_at') is distinct from (to_jsonb(old) - 'is_read' - 'updated_at') then
    raise exception 'portal clients can only mark messages as read' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_message_portal_write on public.messages;
create trigger guard_message_portal_write
  before insert or update on public.messages
  for each row execute function app.guard_message_portal_write();
