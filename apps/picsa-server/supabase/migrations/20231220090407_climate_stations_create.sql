create table
  public.climate_stations (
    station_id bigint generated by default as identity,
    station_name text null,
    latitude real null,
    longitude real null,
    elevation smallint null,
    district text null,
    country_code text null,
    constraint climate_stations_pkey primary key (station_id)
  ) tablespace pg_default;