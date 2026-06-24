-- Harden handle_new_user: this function is only meant to run via the database trigger,
-- never called directly through the REST API.

-- Fix 1: revoke direct REST API access from both API roles
revoke execute on function public.handle_new_user() from anon;
revoke execute on function public.handle_new_user() from authenticated;

-- Fix 2: lock down search_path to prevent search path injection attacks
alter function public.handle_new_user() set search_path = public;
