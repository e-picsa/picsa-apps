ALTER TABLE crop_data DROP COLUMN label;

ALTER TABLE crop_data ADD maturity_days_lower integer;
ALTER TABLE crop_data ADD maturity_days_upper integer;
ALTER TABLE crop_data ADD maturity_category text;
ALTER TABLE crop_data ADD seed_company text;

DROP TABLE if exists public.crop_station_data cascade;

create table
  public.crop_data_downscaled (
    id text not null default gen_random_uuid (),
    created_at timestamp with time zone DEFAULT "now"() NOT NULL,
    updated_at timestamp with time zone DEFAULT "now"() NOT NULL,
    -- location admin boundaries, including multiple levels where required
    -- https://wiki.openstreetmap.org/w/index.php
    country_code text NOT NULL,
    location_code text NOT NULL,
    crop_id text NOT NULL,

    water_requirement integer,

-- TODO - specific override columns to replace global data (columns as required)

    metadata jsonb NOT NULL default '{}'::jsonb,
    
    constraint crop_data_downscaled_pkey primary key (id),
    constraint public_crop_data_downscaled_crop_id_fkey foreign key (crop_id) references crop_data (id)

  ) tablespace pg_default;