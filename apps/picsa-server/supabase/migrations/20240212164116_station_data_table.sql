create table
  public.station_data (
    id bigint generated by default as identity,
    created_at timestamp with time zone not null default now(),
    crop_name text null,
    station bigint null,
    constraint station_data_pkey primary key (id),
    constraint station_data_station_fkey foreign key (station) references station_crop_information (id)
  ) tablespace pg_default;