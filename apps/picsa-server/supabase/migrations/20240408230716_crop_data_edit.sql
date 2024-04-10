-- delete previous tables to make it easier to migrate
drop table if exists public.climate_station_crop_data cascade;
drop table if exists public.crop_data cascade;

create table
  public.crop_data (
    id text GENERATED ALWAYS AS (crop || '/' || variety) STORED,
    created_at timestamp with time zone not null default now(),
    crop text not null,
    variety text not null,
    label text null,
    constraint crop_data_pkey primary key (crop,variety),
    constraint crop_data_id_key unique (id)
  ) tablespace pg_default;

  create table
  public.crop_station_data (
    crop_id text not null,
    station_id bigint not null,
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
    constraint public_crop_station_data_station_id_fkey foreign key (station_id) references climate_stations (station_id)
  ) tablespace pg_default;