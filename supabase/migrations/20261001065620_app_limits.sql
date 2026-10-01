-- Limits the user sets. The phone keeps its own copy for enforcement;
-- this table is the backup + cross-device sync.
create table public.app_limits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  packages text[] not null default '{}',     -- apps picked one by one
  categories text[] not null default '{}',   -- whole categories picked
  sessions_per_day int not null check (sessions_per_day between 1 and 20),
  session_minutes int not null check (session_minutes between 5 and 480),
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

-- Every check-in on the gate screen (for streaks, insights, "you skipped 12 times this week")
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  limit_id uuid references public.app_limits (id) on delete cascade,
  package_name text not null,
  intention text not null default '',
  outcome text not null check (outcome in ('started', 'skipped')),
  created_at timestamptz not null default now()
);
create index checkins_user_created_idx on public.checkins (user_id, created_at desc);

-- Fix categories for apps that don't declare one, without shipping an app update
create table public.app_category_overrides (
  package_name text primary key,
  category text not null
);

alter table public.app_limits enable row level security;
alter table public.checkins enable row level security;
alter table public.app_category_overrides enable row level security;

create policy "own limits" on public.app_limits
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own checkins" on public.checkins
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "anyone signed in can read overrides" on public.app_category_overrides
  for select to authenticated using (true);
