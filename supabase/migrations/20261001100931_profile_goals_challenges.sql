-- Profile tab, goals/challenges screen and account deletion.

-- Name and photo for the profile tab. Google sign-ups fill them from their account.
alter table public.profiles
  add column display_name text check (char_length(display_name) between 1 and 60),
  add column avatar_url text check (char_length(avatar_url) <= 500);

-- A goal can be a challenge: keep at it for N days.
alter table public.goals
  add column challenge_days int check (challenge_days between 1 and 365),
  add column completed_at timestamptz;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    nullif(left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 60), ''),
    nullif(left(coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture', ''), 500), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Settings > Delete account. Every user table cascades from auth.users.
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'not signed in';
  end if;
  delete from auth.users where id = (select auth.uid());
end;
$$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
