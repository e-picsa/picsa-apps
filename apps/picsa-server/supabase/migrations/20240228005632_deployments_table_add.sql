create table
  public.deployments (
    id text not null,
    country_code text null,
    label text not null,
    configuration jsonb not null default '{}'::jsonb,
    variant text null default 'extension'::text,
    access_key_md5 text null,
    public boolean not null default true,
    icon_path text null,
    constraint deployments_pkey primary key (id),
    constraint deployments_icon_path_fkey foreign key (icon_path) references storage.objects (path) on delete set null,
    constraint deployments_variant_check check (
      (
        (variant = 'farmer'::text)
        or (variant = 'extension'::text)
        or (variant = 'other'::text)
      )
    )
  ) tablespace pg_default;