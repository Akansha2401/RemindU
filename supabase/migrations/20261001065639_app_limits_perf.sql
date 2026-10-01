-- Evaluate auth.uid() once per query instead of once per row
drop policy "own limits" on public.app_limits;
create policy "own limits" on public.app_limits
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy "own checkins" on public.checkins;
create policy "own checkins" on public.checkins
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Cover foreign keys used by RLS filters and cascading deletes
create index app_limits_user_id_idx on public.app_limits (user_id);
create index checkins_limit_id_idx on public.checkins (limit_id);
