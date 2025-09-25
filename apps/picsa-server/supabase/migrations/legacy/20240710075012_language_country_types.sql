-- Create a list of permissable country codes
create type public.country_code as enum ('global','mw', 'zm', 'tj');


-- Create a list of allowable locales, consisting of {country_code}_{lanuage_code} 
create type public.locale_code as enum ('global_en','mw_ny', 'mw_tum', 'zm_ny', 'tj_tg');

-- NOTE - future additions can be include via
-- ALTER TYPE name ADD VALUE new_enum_value
-- https://www.postgresql.org/docs/current/sql-altertype.html

-- Ensure resources data contains valid country and language data
alter table public.resource_files
alter column country_code DROP DEFAULT,
alter column country_code TYPE country_code USING country_code::country_code;

UPDATE public.resource_files SET country_code = 'global'::country_code WHERE country_code IS NULL;

alter table public.resource_files
alter column country_code SET DEFAULT 'global'::country_code,
alter column country_code SET NOT NULL;


-- Resource child
alter table public.resource_files_child
alter column country_code DROP DEFAULT,
alter column country_code TYPE country_code USING country_code::country_code;

UPDATE public.resource_files_child SET country_code = 'global'::country_code WHERE country_code IS NULL;

alter table public.resource_files_child
alter column country_code SET DEFAULT 'global'::country_code,
alter column country_code SET NOT NULL;
