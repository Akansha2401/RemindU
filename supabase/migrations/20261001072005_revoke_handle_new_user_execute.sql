-- Trigger-only function: nobody should call it through the API
revoke execute on function public.handle_new_user() from public, anon, authenticated;
