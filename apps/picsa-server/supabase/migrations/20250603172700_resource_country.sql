alter table public.resource_collections
add column country_code country_code DEFAULT 'global'::country_code;

alter table public.resource_links
add column country_code country_code DEFAULT 'global'::country_code;