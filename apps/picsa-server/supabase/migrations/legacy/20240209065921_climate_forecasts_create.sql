create table
  public.climate_forecasts (
    id character varying not null,
    district text null,
    filename text not null,
    language_code text null,
    type text null,
    date_modified timestamp with time zone not null,
    country_code character varying null,
    storage_file uuid null,
    constraint climate_forecasts_pkey primary key (id),
    constraint climate_forecasts_storage_file_fkey foreign key (storage_file) references storage.objects (id) on update cascade on delete cascade
  ) tablespace pg_default;