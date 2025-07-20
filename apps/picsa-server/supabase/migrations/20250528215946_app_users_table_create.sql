create table
  public.app_users (
    device_id text not null,
    country text not null,
    user_type text null,
    platform text null,
    constraint app_users_pkey primary key (device_id)
  ) tablespace pg_default;