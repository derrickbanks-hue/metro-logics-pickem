-- Metro Logics Pick'em: core schema
-- Tables are prefixed pickem_ since this Supabase project hosts several
-- other apps (cc_, gemba_, mlc_, etc.) sharing the same database.

-- ── Profiles ──────────────────────────────────────────────────────────────
create table if not exists public.pickem_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  department text,
  email text,
  avatar_url text,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.pickem_profiles enable row level security;

create policy "pickem profiles are viewable by everyone"
  on public.pickem_profiles for select using (true);

create policy "pickem users can insert own profile"
  on public.pickem_profiles for insert with check (auth.uid() = id);

create policy "pickem users can update own profile"
  on public.pickem_profiles for update using (auth.uid() = id);

-- Auto-create a profile row whenever someone signs up.
create or replace function public.pickem_handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.pickem_profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists pickem_on_auth_user_created on auth.users;
create trigger pickem_on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.pickem_handle_new_user();

-- Only the service role (Edge Functions, or SQL run by an admin) may flip
-- is_admin — otherwise a user could grant themselves admin through the same
-- "update your own profile" policy that lets them set their name/avatar.
create or replace function public.pickem_protect_admin_flag()
returns trigger
language plpgsql
as $$
begin
  if new.is_admin is distinct from old.is_admin and auth.role() <> 'service_role' then
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;

drop trigger if exists pickem_profiles_protect_admin on public.pickem_profiles;
create trigger pickem_profiles_protect_admin
  before update on public.pickem_profiles
  for each row execute procedure public.pickem_protect_admin_flag();

-- ── Games ─────────────────────────────────────────────────────────────────
-- id = CollegeFootballData.com game id, used as-is so upserts are idempotent.
create table if not exists public.pickem_games (
  id bigint primary key,
  season int not null,
  week int not null,
  season_type text not null default 'regular',
  start_date timestamptz not null,
  home_team text not null,
  away_team text not null,
  home_conference text,
  away_conference text,
  home_points int,
  away_points int,
  status text not null default 'scheduled' check (status in ('scheduled', 'in_progress', 'final')),
  winner text,
  scored boolean not null default false,
  updated_at timestamptz not null default now()
);

create index if not exists pickem_games_season_week_idx on public.pickem_games (season, week);

alter table public.pickem_games enable row level security;

create policy "pickem games are viewable by everyone"
  on public.pickem_games for select using (true);
-- No insert/update/delete policy for authenticated users: only the service
-- role (used by the sync-games / score-picks Edge Functions) can write here.

-- ── Picks ─────────────────────────────────────────────────────────────────
create table if not exists public.pickem_picks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.pickem_profiles (id) on delete cascade,
  game_id bigint not null references public.pickem_games (id) on delete cascade,
  picked_team text not null,
  is_correct boolean,
  points_earned int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, game_id)
);

create index if not exists pickem_picks_user_idx on public.pickem_picks (user_id);
create index if not exists pickem_picks_game_idx on public.pickem_picks (game_id);

create or replace function public.pickem_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists pickem_picks_set_updated_at on public.pickem_picks;
create trigger pickem_picks_set_updated_at
  before update on public.pickem_picks
  for each row execute procedure public.pickem_set_updated_at();

alter table public.pickem_picks enable row level security;

-- Picks are visible to their owner immediately, and to everyone else only
-- once that specific game has kicked off. This stops people from copying
-- picks before making their own.
create policy "pickem picks viewable if own or game started"
  on public.pickem_picks for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.pickem_games g
      where g.id = pickem_picks.game_id and g.start_date <= now()
    )
  );

create policy "pickem users can pick before kickoff"
  on public.pickem_picks for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.pickem_games g
      where g.id = game_id and g.start_date > now()
    )
  );

create policy "pickem users can change their pick before kickoff"
  on public.pickem_picks for update
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.pickem_games g
      where g.id = pickem_picks.game_id and g.start_date > now()
    )
  )
  with check (auth.uid() = user_id);

-- ── Leaderboard views ────────────────────────────────────────────────────
create or replace view public.pickem_season_leaderboard as
select
  pr.id as user_id,
  pr.full_name,
  pr.department,
  pr.avatar_url,
  g.season,
  count(*) filter (where pk.is_correct is not null) as scored_picks,
  count(*) filter (where pk.is_correct) as correct_picks,
  coalesce(sum(pk.points_earned), 0) as total_points,
  round(
    100.0 * count(*) filter (where pk.is_correct)
      / nullif(count(*) filter (where pk.is_correct is not null), 0),
    1
  ) as win_pct
from public.pickem_profiles pr
join public.pickem_picks pk on pk.user_id = pr.id
join public.pickem_games g on g.id = pk.game_id
group by pr.id, pr.full_name, pr.department, pr.avatar_url, g.season;

create or replace view public.pickem_weekly_leaderboard as
select
  pr.id as user_id,
  pr.full_name,
  pr.avatar_url,
  g.season,
  g.week,
  count(*) filter (where pk.is_correct is not null) as scored_picks,
  count(*) filter (where pk.is_correct) as correct_picks,
  coalesce(sum(pk.points_earned), 0) as points
from public.pickem_profiles pr
join public.pickem_picks pk on pk.user_id = pr.id
join public.pickem_games g on g.id = pk.game_id
group by pr.id, pr.full_name, pr.avatar_url, g.season, g.week;

-- ── Avatar storage ───────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('pickem-avatars', 'pickem-avatars', true)
on conflict (id) do nothing;

drop policy if exists "Pickem avatars are publicly accessible" on storage.objects;
create policy "Pickem avatars are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'pickem-avatars');

drop policy if exists "Pickem users can upload their own avatar" on storage.objects;
create policy "Pickem users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'pickem-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Pickem users can update their own avatar" on storage.objects;
create policy "Pickem users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'pickem-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Pickem users can delete their own avatar" on storage.objects;
create policy "Pickem users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'pickem-avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
