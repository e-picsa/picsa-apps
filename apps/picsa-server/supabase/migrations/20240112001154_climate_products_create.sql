create table
  public.climate_products (
    created_at timestamp with time zone not null default now(),
    station_id bigint null,
    type text not null,
    data jsonb not null,
    constraint climate_products_pkey primary key (station_id, type),
    constraint climate_products_station_id_fkey foreign key (station_id) references climate_stations (station_id) on delete cascade
  ) tablespace pg_default;