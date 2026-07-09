-- ============================================================================
-- Migration 4 — COMMUNITY: groups, challenges, posts, comments, badges,
-- community settings.
--
-- IMPORTANT semantic note (flagged in SCHEMA_MIGRATION.md): Base44's literal
-- rules only let a post's author and the community-owning coach read posts —
-- group members could not see each other's posts, which can't have been the
-- intent (feeds worked because Base44 reads happened through looser paths).
-- This port adds explicit, documented member-read policies so the community
-- feed still functions under default-deny RLS.
--
-- author_id on posts/comments is a *client id* when a portal client posts
-- and a *profile id* when the coach posts. It therefore has NO foreign key;
-- both cases are handled in the policies. Splitting it into two typed
-- columns is listed as an open question.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- community_groups  (Base44: CommunityGroup)
-- member_ids: uuid[] of client ids (no array FKs in Postgres).
-- ---------------------------------------------------------------------------
create table public.community_groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  cover_image_url text,
  coach_id uuid not null references public.profiles (id) on delete cascade,
  member_ids uuid[] not null default '{}',
  feed_enabled boolean not null default true,
  leaderboard_enabled boolean not null default true,
  challenges_enabled boolean not null default true,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.community_groups enable row level security;
select app.add_updated_at_trigger('public.community_groups');
create index community_groups_coach_id_idx on public.community_groups (coach_id);

-- True when the current portal client is listed in the given member array.
create or replace function app.portal_client_in(members uuid[])
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from unnest(coalesce(members, '{}'::uuid[])) m
    where app.is_portal_client(m)
  );
$$;

create policy "select coach or member or admin" on public.community_groups
  for select to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid())
         or app.portal_client_in(member_ids) or app.is_admin());
create policy "insert own" on public.community_groups
  for insert to authenticated with check (created_by = (select auth.uid()) and coach_id = (select auth.uid()));
create policy "update own or admin" on public.community_groups
  for update to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "delete own or admin" on public.community_groups
  for delete to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());

-- ---------------------------------------------------------------------------
-- challenges  (Base44: Challenge)
-- participants: uuid[] of client ids.
-- ---------------------------------------------------------------------------
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  type text not null default 'workouts' check (type in
    ('steps', 'workouts', 'water', 'streak', 'custom')),
  goal numeric(12, 0) not null,
  start_date date not null,
  end_date date not null,
  is_active boolean not null default true,
  participants uuid[] not null default '{}',
  emoji text not null default '🏆',
  group_id uuid references public.community_groups (id) on delete set null,
  reward_badge text,
  completed_count integer,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.challenges enable row level security;
select app.add_updated_at_trigger('public.challenges');
create index challenges_group_id_idx on public.challenges (group_id);
create index challenges_created_by_idx on public.challenges (created_by);

create policy "select own or participant or admin" on public.challenges
  for select to authenticated
  using (created_by = (select auth.uid()) or app.portal_client_in(participants) or app.is_admin());
create policy "insert own" on public.challenges
  for insert to authenticated with check (created_by = (select auth.uid()));
create policy "update own or admin" on public.challenges
  for update to authenticated
  using (created_by = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or app.is_admin());
create policy "delete own or admin" on public.challenges
  for delete to authenticated
  using (created_by = (select auth.uid()) or app.is_admin());

-- ---------------------------------------------------------------------------
-- community_posts  (Base44: CommunityPost)
-- reactions: jsonb map of emoji -> [ids]; likes: uuid[] (mixed ids, no FK).
-- ---------------------------------------------------------------------------
create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null, -- client id OR profile id, no FK (see header note)
  author_name text,
  author_avatar text,
  coach_id uuid references public.profiles (id) on delete cascade, -- tenant key
  group_id uuid references public.community_groups (id) on delete cascade,
  is_anonymous boolean not null default false,
  is_coach boolean not null default false,
  is_pinned boolean not null default false,
  is_announcement boolean not null default false,
  content text not null,
  media_urls text[] not null default '{}',
  type text not null default 'post' check (type in
    ('post', 'milestone', 'challenge_update', 'announcement')),
  challenge_id uuid references public.challenges (id) on delete set null,
  reactions jsonb not null default '{}',
  comment_count integer not null default 0,
  is_hidden boolean not null default false,
  likes uuid[] not null default '{}',
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.community_posts enable row level security;
select app.add_updated_at_trigger('public.community_posts');
create index community_posts_coach_id_idx on public.community_posts (coach_id);
create index community_posts_group_id_idx on public.community_posts (group_id);
create index community_posts_created_idx on public.community_posts (created_at);

-- Shared read predicate for posts, reused by post_comments so a comment is
-- visible exactly where its parent post is.
create or replace function app.can_read_post(target_post uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.community_posts p
    where p.id = target_post
      and (
        p.created_by = auth.uid()
        or p.author_id = auth.uid()
        or p.coach_id = auth.uid()
        or app.is_admin()
        or app.is_portal_client(p.author_id)
        -- member of the post's group
        or (p.group_id is not null and exists (
              select 1 from public.community_groups g
              where g.id = p.group_id and app.portal_client_in(g.member_ids)))
        -- coach-wide post visible to all of that coach's portal clients
        or (p.group_id is null and app.portal_coach_is(p.coach_id))
      )
  );
$$;

create policy "select author or coach or member or admin" on public.community_posts
  for select to authenticated
  using (app.can_read_post(id));
create policy "insert own or portal author" on public.community_posts
  for insert to authenticated
  with check (((created_by = (select auth.uid()) and (coach_id is null or coach_id = (select auth.uid())))
     or (app.is_portal_client(author_id) and (coach_id is null or app.portal_coach_is(coach_id))))
    and (group_id is null or exists (
          select 1 from public.community_groups g
          where g.id = group_id
            and (g.coach_id = (select auth.uid()) or g.created_by = (select auth.uid())
                 or app.portal_client_in(g.member_ids)))));
create policy "update own or portal author or coach or admin" on public.community_posts
  for update to authenticated
  using (created_by = (select auth.uid()) or app.is_portal_client(author_id)
         or coach_id = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or app.is_portal_client(author_id)
              or coach_id = (select auth.uid()) or app.is_admin());
create policy "delete own or portal author or coach or admin" on public.community_posts
  for delete to authenticated
  using (created_by = (select auth.uid()) or app.is_portal_client(author_id)
         or coach_id = (select auth.uid()) or app.is_admin());

-- ---------------------------------------------------------------------------
-- post_comments  (Base44: PostComment)
-- ---------------------------------------------------------------------------
create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts (id) on delete cascade,
  author_id uuid not null, -- client id OR profile id, no FK
  author_name text,
  coach_id uuid references public.profiles (id) on delete cascade,
  is_coach boolean not null default false,
  content text not null,
  likes uuid[] not null default '{}',
  parent_comment_id uuid references public.post_comments (id) on delete cascade,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.post_comments enable row level security;
select app.add_updated_at_trigger('public.post_comments');
create index post_comments_post_id_idx on public.post_comments (post_id);

create policy "select where parent post readable" on public.post_comments
  for select to authenticated
  using (created_by = (select auth.uid()) or app.can_read_post(post_id) or app.is_admin());
create policy "insert own or portal author on readable post" on public.post_comments
  for insert to authenticated
  with check ((created_by = (select auth.uid()) or app.is_portal_client(author_id))
    and (coach_id is null or coach_id = (select auth.uid()) or app.portal_coach_is(coach_id))
    and app.can_read_post(post_id));
create policy "update own or portal author or admin" on public.post_comments
  for update to authenticated
  using (created_by = (select auth.uid()) or app.is_portal_client(author_id) or app.is_admin())
  with check (created_by = (select auth.uid()) or app.is_portal_client(author_id) or app.is_admin());
create policy "delete own or portal author or coach or admin" on public.post_comments
  for delete to authenticated
  using (created_by = (select auth.uid()) or app.is_portal_client(author_id)
         or coach_id = (select auth.uid()) or app.is_admin());

-- ---------------------------------------------------------------------------
-- client_badges  (Base44: ClientBadge)
-- Awarded by the coach/automation; clients read their own. update/delete
-- were admin-only in Base44 (badges are immutable once earned); preserved.
-- ---------------------------------------------------------------------------
create table public.client_badges (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  client_name text,
  badge_key text not null check (badge_key in
    ('streak_7', 'streak_14', 'streak_30', 'perfect_week', 'pr_hit',
     'comeback', 'consistent_month', 'goal_reached')),
  earned_date date not null,
  notes text,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.client_badges enable row level security;
select app.add_updated_at_trigger('public.client_badges');
create index client_badges_client_id_idx on public.client_badges (client_id);

create policy "select coach or portal or admin" on public.client_badges
  for select to authenticated
  using (created_by = (select auth.uid()) or app.owns_client(client_id)
         or app.is_portal_client(client_id) or app.is_admin());
create policy "insert own" on public.client_badges
  for insert to authenticated with check (app.owns_client(client_id) or app.is_admin());
create policy "update admin" on public.client_badges
  for update to authenticated using (app.is_admin()) with check (app.is_admin());
create policy "delete admin" on public.client_badges
  for delete to authenticated using (app.is_admin());

-- ---------------------------------------------------------------------------
-- community_settings  (Base44: CommunitySettings) — singleton per coach
-- ---------------------------------------------------------------------------
create table public.community_settings (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid references public.profiles (id) on delete cascade,
  feed_enabled boolean not null default true,
  leaderboard_enabled boolean not null default true,
  challenges_enabled boolean not null default true,
  description text,
  created_by uuid default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.community_settings enable row level security;
select app.add_updated_at_trigger('public.community_settings');
create unique index community_settings_coach_id_key on public.community_settings (coach_id)
  where coach_id is not null;

create policy "select own or admin" on public.community_settings
  for select to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "insert own" on public.community_settings
  for insert to authenticated with check (created_by = (select auth.uid()) and (coach_id is null or coach_id = (select auth.uid())));
create policy "update own or admin" on public.community_settings
  for update to authenticated
  using (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin())
  with check (created_by = (select auth.uid()) or coach_id = (select auth.uid()) or app.is_admin());
create policy "delete admin" on public.community_settings
  for delete to authenticated using (app.is_admin());
