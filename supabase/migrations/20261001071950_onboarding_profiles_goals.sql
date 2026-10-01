-- BRD 12: profiles, goals and app_rules, plus the onboarding columns
-- (persona, goals.why, acquisition_source, acquisition_creator).

-- One row per user, created by a trigger on sign-up.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  persona text check (persona in (
    'student', 'exam_prep', 'professional', 'founder', 'creator', 'teacher', 'other'
  )),
  acquisition_source text check (acquisition_source in (
    'creator', 'instagram', 'youtube', 'friend', 'other'
  )),
  acquisition_creator text check (char_length(acquisition_creator) <= 80),
  plan text not null default 'free' check (plan in ('free', 'pro')),
  time_zone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Goal history. Ids are generated on the client so offline retries are safe (BRD 12.2).
create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  text text not null check (char_length(text) between 3 and 80),
  why text check (char_length(why) <= 200),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Only one active goal per user
create unique index goals_one_active_per_user on public.goals (user_id) where is_active;
create index goals_user_id_idx on public.goals (user_id);

-- Distracting apps and (Phase 2) daily limits
create table public.app_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  package_name text not null,
  label text,
  daily_limit_min int check (daily_limit_min between 1 and 1440),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, package_name)
);

alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.app_rules enable row level security;

-- Profiles are inserted by the trigger below, so users only read and update their own.
create policy "own profile read" on public.profiles
  for select using (id = (select auth.uid()));
create policy "own profile update" on public.profiles
  for update using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "own goals" on public.goals
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own app rules" on public.app_rules
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Create the profile row on sign-up
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep updated_at current (last write wins by updated_at, BRD 12.2)
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger goals_updated_at before update on public.goals
  for each row execute function public.set_updated_at();
create trigger app_rules_updated_at before update on public.app_rules
  for each row execute function public.set_updated_at();
