drop function if exists public.get_non_anonymous_users();

create function public.get_non_anonymous_users()
returns table (
  id uuid,
  email text,
  email_confirmed_at timestamp with time zone,
  last_sign_in_at timestamp with time zone,
  full_name text,
  organisation text
)
language sql
security definer
as $$
  select
    u.id,
    u.email,
    u.email_confirmed_at,
    u.last_sign_in_at,
    coalesce(p.full_name, u.raw_user_meta_data->>'full_name') as full_name,
    coalesce(p.organisation, u.raw_user_meta_data->>'organisation') as organisation
  from auth.users u
  left join public.user_profiles p on u.id = p.user_id
  where u.is_anonymous = false;
$$;

-- Revoke execute from everyone
revoke all on function public.get_non_anonymous_users() from public;

-- Explicitly grant only to service_role
grant execute on function public.get_non_anonymous_users() to service_role;
