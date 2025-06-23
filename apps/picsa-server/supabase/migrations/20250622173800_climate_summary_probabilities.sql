create table
  public.climate_summary_probabilities (
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    station_id text not null,
    country_code country_code not null,
    metadata jsonb not null,
    data jsonb[] not null,
    constraint climate_summary_probabilities_pkey primary key (
      country_code,
      station_id
    ),
    constraint climate_summary_probabilities_station_id_fkey foreign key (station_id) references climate_stations (id) on delete cascade
  ) tablespace pg_default;

--  NOTE - required extensions - allow moddatetime
create trigger handle_updated_at before update on public.climate_summary_probabilities
  for each row execute procedure moddatetime (updated_at);