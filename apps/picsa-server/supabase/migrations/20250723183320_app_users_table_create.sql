create table public.app_users (
  user_id uuid not null primary key
    references auth.users (id) on delete cascade, -- link to Supabase Auth user
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  country_code text null,
  language_code text null,
  user_type text null,
  platform text null
) tablespace pg_default;

-- NOTE - required extensions - allow moddatetime
create trigger handle_updated_at
before update on public.app_users
for each row
execute procedure moddatetime(updated_at);

-- Enable RLS
alter table app_users enable row level security;

-- Allow users to select their own row
create policy "Users can view their own data only"
on app_users
for select
to authenticated
using (
  (select auth.uid()) = user_id
);

-- Allow users to insert their own row
create policy "Users can insert their own app_user"
on app_users
for insert
to authenticated
with check ( (select auth.uid()) = user_id );

-- Allow users to update their own row
create policy "Users can update their own app_user"
on app_users
for update
to authenticated
with check ( (select auth.uid()) = user_id );