-- Rehearsal for migration 20261006000200_portal_write_hardening.
-- Reproduces smoke-test items 7 + 12 against a local migrated database:
--   psql "$POSTGRES_URL" -v ON_ERROR_STOP=1 -f scripts/verify-portal-write-hardening.sql
-- Every check raises on failure; the final line prints ALL PASSED.
\set coach  '''11111111-1111-1111-1111-111111111111'''
\set portal '''22222222-2222-2222-2222-222222222222'''
\set client '''33333333-3333-3333-3333-333333333333'''

begin;
-- Supabase grants table privileges to `authenticated` by default (RLS does the
-- filtering); a bare local Postgres doesn't. Emulate it for the base tables
-- only — NOT the view, whose grants are what this rehearsal checks.
grant select, insert, update, delete on public.messages, public.check_ins, public.clients to authenticated;
insert into auth.users (id, email) values (:coach, 'coach@test.invalid'), (:portal, 'client@test.invalid')
  on conflict do nothing;
insert into public.profiles (id, email) values (:coach, 'coach@test.invalid'), (:portal, 'client@test.invalid')
  on conflict do nothing;
insert into public.clients (id, name, email, user_id, created_by, portal_user_id)
  values (:client, 'Portal Client', 'client@test.invalid', :coach, :coach, :portal);
insert into public.messages (id, client_id, sender, content, created_by)
  values ('44444444-4444-4444-4444-444444444444', :client, 'coach', 'original coach text', :coach);

-- ── act as the portal client ────────────────────────────────────────────────
set local role authenticated;
select set_config('request.jwt.claim.sub', :portal, true);
select set_config('request.jwt.claim.role', 'authenticated', true);

-- 1. forged check-in: coach-only fields must be scrubbed
insert into public.check_ins_portal_view (id, client_id, date, weight, notes, review_status, coach_notes, coach_responded, ai_summary)
values ('55555555-5555-5555-5555-555555555555', :client, current_date, 180, 'mine',
        'reviewed', 'FORGED coach note', true, '{"forged": true}');

do $$ declare r record; begin
  select review_status, coach_notes, coach_responded, ai_summary, notes into r
    from public.check_ins_portal_view where id = '55555555-5555-5555-5555-555555555555';
  if r.review_status <> 'pending' or r.coach_notes is not null or r.coach_responded or r.ai_summary is not null then
    raise exception 'FAIL 1: forged coach fields survived: %', row_to_json(r);
  end if;
  if r.notes <> 'mine' then raise exception 'FAIL 1: client fields lost'; end if;
  raise notice 'PASS 1  portal check-in insert scrubs coach-only fields';
end $$;

-- 2. portal can no longer update / delete through the view
do $$ begin
  begin
    update public.check_ins_portal_view set coach_notes = 'x' where id = '55555555-5555-5555-5555-555555555555';
    raise exception 'FAIL 2: portal update allowed';
  exception when insufficient_privilege then raise notice 'PASS 2a portal update via view denied'; end;
  begin
    delete from public.check_ins_portal_view where id = '55555555-5555-5555-5555-555555555555';
    raise exception 'FAIL 2: portal delete allowed';
  exception when insufficient_privilege then raise notice 'PASS 2b portal delete via view denied'; end;
end $$;

-- 3. spoofed sender becomes 'client'
insert into public.messages (id, client_id, sender, content, is_pinned, is_broadcast)
values ('66666666-6666-6666-6666-666666666666', :client, 'coach', 'pretending to be coach', true, true);
do $$ declare r record; begin
  select sender, is_pinned, is_broadcast, created_by into r from public.messages where id = '66666666-6666-6666-6666-666666666666';
  if r.sender <> 'client' or r.is_pinned or r.is_broadcast or r.created_by <> '22222222-2222-2222-2222-222222222222' then
    raise exception 'FAIL 3: spoof survived: %', row_to_json(r);
  end if;
  raise notice 'PASS 3  portal message insert forced to sender=client';
end $$;

-- 4. portal may mark the coach message read, but not rewrite it
update public.messages set is_read = true where id = '44444444-4444-4444-4444-444444444444';
do $$ begin
  if not (select is_read from public.messages where id = '44444444-4444-4444-4444-444444444444') then
    raise exception 'FAIL 4a: mark-read blocked';
  end if;
  raise notice 'PASS 4a portal can mark coach message read';
  begin
    update public.messages set content = 'TAMPERED' where id = '44444444-4444-4444-4444-444444444444';
    raise exception 'FAIL 4b: portal rewrote coach message';
  exception when insufficient_privilege then raise notice 'PASS 4b portal cannot rewrite coach message'; end;
end $$;

-- ── act as the owning coach: nothing should be scrubbed ─────────────────────
select set_config('request.jwt.claim.sub', :coach, true);
update public.check_ins set review_status = 'reviewed', coach_notes = 'real note', coach_responded = true
  where id = '55555555-5555-5555-5555-555555555555';
insert into public.messages (id, client_id, sender, content) values ('77777777-7777-7777-7777-777777777777', :client, 'coach', 'real coach msg');
do $$ declare r record; m text; begin
  select review_status, coach_notes, coach_responded into r from public.check_ins where id = '55555555-5555-5555-5555-555555555555';
  if r.review_status <> 'reviewed' or r.coach_notes <> 'real note' or not r.coach_responded then
    raise exception 'FAIL 5: coach review write was blocked: %', row_to_json(r);
  end if;
  select sender into m from public.messages where id = '77777777-7777-7777-7777-777777777777';
  if m <> 'coach' then raise exception 'FAIL 5: coach sender rewritten'; end if;
  raise notice 'PASS 5  coach writes untouched';
end $$;

select 'ALL PASSED' as result;
rollback;
