create table
  public.deployments (
    id text not null,
    country_code text null,
    label text not null,
    org_code text null,
    configuration jsonb not null default '{}'::jsonb,
    variant text null default 'extension'::text,
    access_key_md5 text null,
    public boolean not null default true,
    constraint deployments_pkey primary key (id),
    constraint deployments_variant_check check (
      (
        (variant = 'farmer'::text)
        or (variant = 'extension'::text)
      )
    )
  ) tablespace pg_default;