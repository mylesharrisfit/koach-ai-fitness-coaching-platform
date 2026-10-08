-- Client app fixes (fix pass 1, item 7).
--
-- 1. Coach identity for portal clients. A portal client could not read their
--    coach's profile (profiles is own-row only), so the client app showed
--    "Your coach" everywhere. portal_coach_view exposes ONLY display fields
--    (name, business name, avatar, logo) of the caller's own coach. Same
--    pattern as clients_portal_view (20260823000400): a definer view filtered
--    by app.is_portal_client, SELECT-only.
--
-- 2. Pending weigh-ins. Coaches schedule a weigh-in (weight = 0) for the
--    client to fill in, but weigh_ins had no portal branch: the client never
--    saw the entry and their WeighIn.update silently matched 0 rows. Portal
--    clients can now read their own weigh-ins, and portal_log_weigh_in() lets
--    them set the weight on their own PENDING entry — nothing else.
--
-- 3. Profile photo. The client app's avatar upload called Client.update on the
--    read-only clients_portal_view and threw. portal_update_my_avatar() sets
--    clients.avatar_url for the caller's own row only, to a file in their own
--    uploads folder (or clears it). No other client column becomes writable.
--
-- (Invoices: the portal's Invoice.update was a fake "mark as paid" after a
--  simulated card payment. That write is removed in the app, not permitted —
--  invoice status must only change from Stripe / the coach.)

-- ── 1. coach display info ────────────────────────────────────────────────────
create or replace view public.portal_coach_view
with (security_barrier = true) as
  select
    c.id as client_id,
    coalesce(
      nullif(btrim(concat_ws(' ', cp.first_name, cp.last_name)), ''),
      nullif(btrim(p.full_name), ''),
      nullif(btrim(cp.business_name), ''),
      nullif(btrim(p.business_name), '')
    ) as coach_name,
    coalesce(
      nullif(btrim(case when wl.is_published then wl.business_name end), ''),
      nullif(btrim(cp.business_name), ''),
      nullif(btrim(p.business_name), '')
    ) as business_name,
    coalesce(nullif(cp.avatar_url, ''), nullif(p.avatar_url, '')) as avatar_url,
    coalesce(
      case when wl.is_published then coalesce(nullif(wl.logo_primary_url, ''), nullif(wl.logo_light_url, ''), nullif(wl.logo_dark_url, '')) end,
      nullif(bs.logo_url, '')
    ) as logo_url
  from public.clients c
  left join public.profiles p on p.id = coalesce(c.user_id, c.created_by)
  left join lateral (
    select * from public.coach_profiles x
     where x.coach_id = p.id or (x.coach_id is null and x.created_by = p.id)
     order by x.updated_at desc nulls last limit 1
  ) cp on true
  left join lateral (
    select * from public.white_label_settings x
     where x.coach_id = p.id or (x.coach_id is null and x.created_by = p.id)
     order by x.updated_at desc nulls last limit 1
  ) wl on true
  left join lateral (
    select * from public.business_settings x
     where x.coach_id = p.id or (x.coach_id is null and x.created_by = p.id)
     order by x.updated_at desc nulls last limit 1
  ) bs on true
  where app.is_portal_client(c.id);

revoke all on public.portal_coach_view from public, anon, authenticated;
grant select on public.portal_coach_view to authenticated;

-- ── 2. weigh-ins ─────────────────────────────────────────────────────────────
drop policy if exists "select portal own" on public.weigh_ins;
create policy "select portal own" on public.weigh_ins
  for select to authenticated
  using (app.is_portal_client(client_id));

create or replace function public.portal_log_weigh_in(p_weigh_in uuid, p_weight numeric)
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $$
begin
  if p_weight is null or p_weight <= 0 or p_weight > 1500 then
    raise exception 'Enter a weight between 1 and 1500' using errcode = '22023';
  end if;
  update public.weigh_ins w
     set weight = p_weight
   where w.id = p_weigh_in
     and app.is_portal_client(w.client_id)
     and coalesce(w.weight, 0) = 0;          -- only the coach's pending entry
  if not found then
    raise exception 'Weigh-in not found or already logged' using errcode = 'P0002';
  end if;
end;
$$;
revoke all on function public.portal_log_weigh_in(uuid, numeric) from public, anon;
grant execute on function public.portal_log_weigh_in(uuid, numeric) to authenticated;

-- ── 3. profile photo ─────────────────────────────────────────────────────────
create or replace function public.portal_update_my_avatar(p_avatar_url text)
 returns void
 language plpgsql
 security definer
 set search_path to ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  -- Only a file in the caller's own uploads folder (what the app uploads), or clear it.
  if p_avatar_url is not null and p_avatar_url not like ('storage://uploads/' || me::text || '/%') then
    raise exception 'Avatar must be your own upload' using errcode = '22023';
  end if;
  update public.clients c
     set avatar_url = p_avatar_url
   where c.portal_user_id = me;
  if not found then
    raise exception 'No client profile for this account' using errcode = 'P0002';
  end if;
end;
$$;
revoke all on function public.portal_update_my_avatar(text) from public, anon;
grant execute on function public.portal_update_my_avatar(text) to authenticated;
