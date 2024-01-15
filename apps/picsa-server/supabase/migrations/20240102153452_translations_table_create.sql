create table
  public.translations (
    created_at timestamp with time zone not null default now(),
    tool text not null,
    context text not null default ''::text,
    en text not null,
    -- Additional languages
    -- Uses ISO 3166 alpha-2 country code and  ISO 639 Set 1 language code
    -- https://en.wikipedia.org/wiki/List_of_ISO_3166_country_codes
    -- https://en.wikipedia.org/wiki/List_of_ISO_639_language_codes
    mw_ny text null,
    ke_sw text null,
    tj_tg text null,
    zm_ny text null,
    -- Primary key generated as combination of tool, context and en text
    constraint translations_pkey primary key (tool, context, en)
  ) tablespace pg_default;