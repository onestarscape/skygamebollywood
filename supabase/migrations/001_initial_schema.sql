create extension if not exists "pgcrypto";

insert into storage.buckets (id, name, public)
values ('posters', 'posters', true)
on conflict (id) do update set public = excluded.public;

create table if not exists public.movies (
  id text primary key,
  title text not null,
  year integer not null check (year between 1900 and 2100),
  language text not null,
  genres text[] not null default '{}',
  director text not null,
  lead_actor text not null,
  lead_actress text not null,
  supporting_actors text[] not null default '{}',
  runtime integer not null check (runtime > 0),
  imdb_rating numeric(3, 1) not null check (imdb_rating between 0 and 10),
  country text not null default 'India',
  poster_url text not null,
  plot text not null,
  dialogue_hint text not null,
  emoji_hint text not null,
  actor_hint text not null,
  awards text[] not null default '{}',
  ott_platform text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.daily_puzzles (
  puzzle_date date primary key,
  movie_id text not null references public.movies(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  guest_id text,
  mode text not null check (mode in ('daily', 'archive', 'unlimited')),
  puzzle_key text not null,
  target_movie_id text not null references public.movies(id) on delete cascade,
  guesses jsonb not null default '[]'::jsonb,
  won boolean not null default false,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint game_progress_owner check (user_id is not null or guest_id is not null)
);

create unique index if not exists game_progress_user_unique
on public.game_progress(user_id, mode, puzzle_key)
where user_id is not null;

create unique index if not exists game_progress_guest_unique
on public.game_progress(guest_id, mode, puzzle_key)
where guest_id is not null;

create table if not exists public.user_stats (
  user_id uuid primary key references auth.users(id) on delete cascade,
  games_played integer not null default 0,
  games_won integer not null default 0,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  total_guesses integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.leaderboard_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  display_name text not null default 'Guest Player',
  puzzle_key text not null,
  guesses integer not null check (guesses > 0),
  seconds integer not null check (seconds > 0),
  won boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists leaderboard_daily_idx on public.leaderboard_entries(puzzle_key, won, guesses, seconds);
create index if not exists leaderboard_created_idx on public.leaderboard_entries(created_at desc);
create index if not exists movies_search_idx on public.movies using gin (to_tsvector('english', title || ' ' || director || ' ' || lead_actor || ' ' || lead_actress));

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  event_name text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists movies_updated_at on public.movies;
create trigger movies_updated_at before update on public.movies
for each row execute procedure public.set_updated_at();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists game_progress_updated_at on public.game_progress;
create trigger game_progress_updated_at before update on public.game_progress
for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'MovieRiddl Player'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.user_stats (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.movies enable row level security;
alter table public.daily_puzzles enable row level security;
alter table public.profiles enable row level security;
alter table public.game_progress enable row level security;
alter table public.user_stats enable row level security;
alter table public.leaderboard_entries enable row level security;
alter table public.analytics_events enable row level security;

drop policy if exists "Movies are readable" on public.movies;
create policy "Movies are readable" on public.movies for select using (true);

drop policy if exists "Daily puzzles are readable" on public.daily_puzzles;
create policy "Daily puzzles are readable" on public.daily_puzzles for select using (true);

drop policy if exists "Profiles are readable" on public.profiles;
create policy "Profiles are readable" on public.profiles for select using (true);

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

drop policy if exists "Users read own progress" on public.game_progress;
create policy "Users read own progress" on public.game_progress for select using (auth.uid() = user_id);

drop policy if exists "Users write own progress" on public.game_progress;
create policy "Users write own progress" on public.game_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users read own stats" on public.user_stats;
create policy "Users read own stats" on public.user_stats for select using (auth.uid() = user_id);

drop policy if exists "Leaderboard is readable" on public.leaderboard_entries;
create policy "Leaderboard is readable" on public.leaderboard_entries for select using (true);

drop policy if exists "Authenticated users submit leaderboard entries" on public.leaderboard_entries;
create policy "Authenticated users submit leaderboard entries" on public.leaderboard_entries
for insert with check (auth.uid() = user_id or user_id is null);

drop policy if exists "Authenticated analytics writes" on public.analytics_events;
create policy "Authenticated analytics writes" on public.analytics_events
for insert with check (auth.uid() = user_id or user_id is null);

drop policy if exists "Poster files are public" on storage.objects;
create policy "Poster files are public" on storage.objects for select using (bucket_id = 'posters');
