
-- Resources
alter table public.resource_collections
add column country_code country_code DEFAULT 'global'::country_code;

alter table public.resource_links
add column country_code country_code DEFAULT 'global'::country_code;

-- Language codes
ALTER TYPE locale_code ADD VALUE 'zm_bem';
ALTER TYPE locale_code ADD VALUE 'zm_toi';
ALTER TYPE locale_code ADD VALUE 'zm_loz';
ALTER TYPE locale_code ADD VALUE 'zm_lun';
ALTER TYPE locale_code ADD VALUE 'zm_kqn';
ALTER TYPE locale_code ADD VALUE 'zm_lue';

-- Translation Column
ALTER table public.translations ADD zm_bem text;
ALTER table public.translations ADD zm_toi text;
ALTER table public.translations ADD zm_loz text;
ALTER table public.translations ADD zm_lun text;
ALTER table public.translations ADD zm_kqn text;
ALTER table public.translations ADD zm_lue text;