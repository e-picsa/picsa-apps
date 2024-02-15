create table
  public.crop_data (
    created_at timestamp with time zone not null default now(),
    variety text not null,
    water_upper double precision not null,
    water_lower double precision not null,
    length_lower double precision not null,
    length_upper double precision not null,
    crop text not null,
    label text null,
    constraint crop_data_pkey primary key (variety, crop)
  ) tablespace pg_default;