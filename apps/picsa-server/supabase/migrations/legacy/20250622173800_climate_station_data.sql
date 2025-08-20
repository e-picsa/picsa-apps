drop table if exists public.climate_summary_probabilities;
drop table if exists public.climate_summary_rainfall;


create table
  public.climate_station_data (
    created_at timestamp with time zone not null default now(),
    updated_at timestamp with time zone not null default now(),
    station_id text not null,
    country_code country_code not null,
    -- api endpoint summaries
    annual_rainfall_data jsonb[],
    annual_rainfall_metadata jsonb, 
    annual_temperature_data jsonb[],
    annual_temperature_metadata jsonb,  
    crop_probability_data jsonb[],
    crop_probability_metadata jsonb, 
    monthly_temperature_data jsonb[],
    monthly_temperature_metadata jsonb, 
    season_start_data jsonb[],
    season_start_metadata jsonb, 
    extremes_data jsonb[],
    extremes_metadata jsonb,    

    constraint climate_station_data_pkey primary key (
      country_code,
      station_id
    ),
    constraint climate_station_data_station_id_fkey foreign key (station_id) references climate_stations (id) on delete cascade
  ) tablespace pg_default;

--  NOTE - required extensions - allow moddatetime
create trigger handle_updated_at before update on public.climate_station_data
  for each row execute procedure moddatetime (updated_at);