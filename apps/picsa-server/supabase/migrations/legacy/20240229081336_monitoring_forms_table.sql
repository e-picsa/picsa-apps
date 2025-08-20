create table
  public.monitoring_forms (
    created_at timestamp with time zone not null default now(),
    title text not null,
    description character varying null,
    enketo_definition jsonb null,
    summary_fields jsonb[] null,
    enketo_form text null,
    enketo_model text null,
    cover_image text null,
    id text not null,
    form_xlsx text null,
    constraint monitoring_forms_pkey primary key (id),
    constraint monitoring_forms_cover_image_fkey foreign key (cover_image) references storage.objects (path) on delete set null,
    constraint monitoring_forms_form_xlsx_fkey foreign key (form_xlsx) references storage.objects (path) on update cascade on delete set null
  ) tablespace pg_default;