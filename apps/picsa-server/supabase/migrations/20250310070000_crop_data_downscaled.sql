DROP TABLE IF EXISTS public.crop_data cascade;

CREATE TABLE public.crop_data(
  -- core data 
  crop text not null,
  variety text not null,
  maturity_period text not null,
  days_lower integer not null,
  days_upper integer not null,

  -- custom information text
  additional_info text,

  -- structured additional (e.g. production year, seed supplier)
  additional_data jsonb NOT NULL default '{}'::jsonb,
  
  -- timestamp data
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  id text GENERATED ALWAYS AS (crop || '/' || variety) STORED,

  constraint crop_data_id_key primary key (id)
) tablespace pg_default;


DROP TABLE if exists public.crop_data_downscaled cascade;

create table
  public.crop_data_downscaled (
    id text GENERATED ALWAYS AS (country_code || '/' || location_id) STORED,
    created_at timestamp with time zone DEFAULT "now"() NOT NULL,
    updated_at timestamp with time zone DEFAULT "now"() NOT NULL,
    
    -- location data
    country_code text NOT NULL,
    location_id text NOT NULL,

    -- crop downscaled data
    water_requirements jsonb NOT NULL default '{}'::jsonb,

    -- specific override columns to replace global data (columns as required)
    override_data jsonb NOT NULL default '{}'::jsonb,
    
    constraint crop_data_downscaled_pkey primary key (id)

  ) tablespace pg_default;