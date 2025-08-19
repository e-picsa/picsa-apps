create table
  public.app_users (
    id uuid not null,
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),

    country_code text null,
    language_code text null,
    user_type text null,
    platform text null,
    
    constraint app_users_pkey primary key (id)
  ) tablespace pg_default;

  --  NOTE - required extensions - allow moddatetime
create trigger handle_updated_at before update on public.app_users
  for each row execute procedure moddatetime (updated_at);