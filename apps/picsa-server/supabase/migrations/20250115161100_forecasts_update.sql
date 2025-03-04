-- recreate table and data
drop table if exists public.climate_forecasts;

-- -- Custom types
create type public.forecast_type as enum ('daily','seasonal','downscaled');

create table
  public.forecasts (
    id character varying not null,
    created_at timestamp with time zone DEFAULT "now"() NOT NULL,
    updated_at timestamp with time zone DEFAULT "now"() NOT NULL,
    forecast_type forecast_type null,
    -- location admin boundaries, including multiple levels where required
    -- https://wiki.openstreetmap.org/w/index.php
    location text[] default array[]::text[],
    country_code text NOT NULL,
    language_code text null,
    storage_file text null,
    mimetype text null,
    constraint forecasts_pkey primary key (id),
    constraint forecasts_storage_file_fkey foreign key (storage_file) references storage.objects (path) on delete cascade
  ) tablespace pg_default;


  -- Enable moddatetime extension to automatically populated `updated_at` columns
-- https://dev.to/paullaros/updating-timestamps-automatically-in-supabase-5f5o
CREATE EXTENSION IF NOT EXISTS "moddatetime" SCHEMA extensions;

--  NOTE - required extensions - allow moddatetime
create trigger handle_updated_at before update on public.forecasts
  for each row execute procedure moddatetime (updated_at);