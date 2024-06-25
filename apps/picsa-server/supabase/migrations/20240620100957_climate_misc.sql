-- Enforce non-null country_code for deployment
alter table public.deployments
alter column country_code set not null;

-- Recreate climate station list table with generated id column (and recreate linked tables)
-- BREAKING - will require re-seeding data

drop table if exists public.climate_products;
drop table if exists public.crop_station_data;
drop table if exists public.climate_stations;

create table
  public.climate_stations (
    id text GENERATED ALWAYS AS (country_code || '/' || station_id) STORED, 
    station_id text not null,
    country_code text not null,
    station_name text null,
    latitude real null,
    longitude real null,
    elevation smallint null,
    district text null,
    constraint climate_stations_pkey primary key (country_code,station_id),
    constraint climate_stations_id_key unique (id)
  ) tablespace pg_default;

create table
  public.climate_products (
    created_at timestamp with time zone not null default now(),
    station_id text not null,
    type text not null,
    data jsonb not null,
    constraint climate_products_pkey primary key (
      station_id,
      type
    ),
    constraint climate_products_station_id_fkey foreign key (station_id) references climate_stations (id) on delete cascade
  ) tablespace pg_default;

  create table
    public.crop_station_data (
      crop_id text not null,
      station_id text not null,
      water_upper integer not null,
      water_lower integer not null,
      days_lower integer not null,
      days_upper integer not null,
      -- probabilities defined in 5-day intervals, with data only stored for non-zero probabilities
      -- first entry defines day number structure, subsequent entries define probabilities for lower/upper cases 
      -- [75,80,85,90,95],[0.1,0.3,0.3,0.7,0.3],[0.1,0.3,0.3,0.7,0.3]
      probabilities real[][] null,
      created_at timestamp with time zone not null default now(),
      constraint crop_station_data_pkey primary key (crop_id, station_id),
      constraint public_crop_station_data_crop_id_fkey foreign key (crop_id) references crop_data (id),
      constraint public_crop_station_data_station_id_fkey foreign key (station_id) references climate_stations (id)
    ) tablespace pg_default;