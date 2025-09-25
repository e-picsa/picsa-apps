create or replace function public.get_non_anonymous_users()
returns table (
  id uuid,
  email text,
  email_confirmed_at timestamp with time zone,
  last_sign_in_at timestamp with time zone
)
language sql
security definer
as $$
  select id, email, email_confirmed_at, last_sign_in_at
  from auth.users
  where is_anonymous = false;
$$;

-- Revoke execute from everyone
revoke all on function public.get_non_anonymous_users() from public;

-- Explicitly grant only to service_role
grant execute on function public.get_non_anonymous_users() to service_role;