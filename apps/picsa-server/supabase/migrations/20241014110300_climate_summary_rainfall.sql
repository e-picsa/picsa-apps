-- Replace generic `climate_products` table with more specific summaries

-- BREAKING - will require re-seeding data
drop table if exists public.climate_products;


create table
  public.climate_summary_rainfall (
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    station_id text not null,
    country_code country_code not null,
    metadata jsonb not null,
    data jsonb[] not null,
    constraint climate_summary_rainfall_pkey primary key (
      country_code,
      station_id
    ),
    constraint climate_summary_rainfall_station_id_fkey foreign key (station_id) references climate_stations (id) on delete cascade
  ) tablespace pg_default;

-- Enable moddatetime extension to automatically populated `updated_at` columns
-- https://dev.to/paullaros/updating-timestamps-automatically-in-supabase-5f5o
CREATE EXTENSION IF NOT EXISTS "moddatetime" SCHEMA extensions;

--  NOTE - required extensions - allow moddatetime
create trigger handle_updated_at before update on public.climate_summary_rainfall
  for each row execute procedure moddatetime (updated_at);