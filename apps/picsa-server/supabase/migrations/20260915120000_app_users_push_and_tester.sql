-- Add push notification token and internal tester flag to app_users
alter table public.app_users
add column if not exists fcm_token text,
add column if not exists fcm_token_updated_at timestamp with time zone,
add column if not exists is_internal_tester boolean not null default false;
