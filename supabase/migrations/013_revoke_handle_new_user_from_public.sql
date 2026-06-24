-- PostgreSQL grants EXECUTE to PUBLIC by default on all functions.
-- Revoking from anon/authenticated individually is not enough if PUBLIC still has the grant.
-- Revoke from PUBLIC to fully block REST API access.
revoke execute on function public.handle_new_user() from public;
