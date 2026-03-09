-- TODO (future migration)
-- 1) Rename translations table to use `BCP 47` enums instead
-- 2) Refactor all platform code db ops to use correct codes
-- 3) Try to make db ops type-safe when country_code column used (manually update generated db.types country_code: string -> CountryCode )

-- Rename migrated data to use valid country codes instead (?)... capitalize and replace `global` with `ZZ`
-- (or maybe just `null` to say non-country-specific (?))... would also have to change default values


-- Drop legacy locale_code enum (will be generated from geo.locales in BCP 47 standard)
DROP TYPE public.locale_code;

-- Drop legacy country_code
-- This is more difficult as various data columns depend on the code
BEGIN;

-- 1. Convert all columns from enum to TEXT
ALTER TABLE public.climate_station_data ALTER COLUMN country_code TYPE TEXT;
ALTER TABLE public.resource_collections ALTER COLUMN country_code TYPE TEXT;
ALTER TABLE public.resource_files ALTER COLUMN country_code TYPE TEXT;
ALTER TABLE public.resource_files_child ALTER COLUMN country_code TYPE TEXT;
ALTER TABLE public.resource_links ALTER COLUMN country_code TYPE TEXT;

-- 2. Drop defaults
ALTER TABLE public.climate_station_data ALTER COLUMN country_code DROP DEFAULT;
ALTER TABLE public.resource_collections ALTER COLUMN country_code DROP DEFAULT;
ALTER TABLE public.resource_files ALTER COLUMN country_code DROP DEFAULT;
ALTER TABLE public.resource_files_child ALTER COLUMN country_code DROP DEFAULT;
ALTER TABLE public.resource_links ALTER COLUMN country_code DROP DEFAULT;

-- 3. Drop composite primary key constraints
ALTER TABLE public.climate_station_data DROP CONSTRAINT climate_station_data_pkey;

-- 4. Drop the old enum
DROP TYPE country_code;

-- 5. Allow NULL BEFORE setting values to NULL
ALTER TABLE public.climate_station_data ALTER COLUMN country_code DROP NOT NULL;
ALTER TABLE public.resource_collections ALTER COLUMN country_code DROP NOT NULL;
ALTER TABLE public.resource_files ALTER COLUMN country_code DROP NOT NULL;
ALTER TABLE public.resource_files_child ALTER COLUMN country_code DROP NOT NULL;
ALTER TABLE public.resource_links ALTER COLUMN country_code DROP NOT NULL;

-- 6. Set 'global' values to NULL
UPDATE public.climate_station_data SET country_code = NULL WHERE country_code = 'global';
UPDATE public.resource_collections SET country_code = NULL WHERE country_code = 'global';
UPDATE public.resource_files SET country_code = NULL WHERE country_code = 'global';
UPDATE public.resource_files_child SET country_code = NULL WHERE country_code = 'global';
UPDATE public.resource_links SET country_code = NULL WHERE country_code = 'global';

-- 7. Uppercase existing lowercase codes
UPDATE public.climate_station_data SET country_code = UPPER(country_code) WHERE country_code IS NOT NULL;
UPDATE public.resource_collections SET country_code = UPPER(country_code) WHERE country_code IS NOT NULL;
UPDATE public.resource_files SET country_code = UPPER(country_code) WHERE country_code IS NOT NULL;
UPDATE public.resource_files_child SET country_code = UPPER(country_code) WHERE country_code IS NOT NULL;
UPDATE public.resource_links SET country_code = UPPER(country_code) WHERE country_code IS NOT NULL;

-- 8. Convert to CHAR(2)
ALTER TABLE public.climate_station_data ALTER COLUMN country_code TYPE CHAR(2);
ALTER TABLE public.resource_collections ALTER COLUMN country_code TYPE CHAR(2);
ALTER TABLE public.resource_files ALTER COLUMN country_code TYPE CHAR(2);
ALTER TABLE public.resource_files_child ALTER COLUMN country_code TYPE CHAR(2);
ALTER TABLE public.resource_links ALTER COLUMN country_code TYPE CHAR(2);

-- 9. Recreate composite keys
ALTER TABLE public.climate_station_data
  ADD CONSTRAINT climate_station_data_pkey
  PRIMARY KEY (country_code, station_id);

-- 10. Add foreign key constraints
ALTER TABLE public.climate_station_data
  ADD CONSTRAINT fk_climate_station_data_country
  FOREIGN KEY (country_code) REFERENCES geo.countries(code);

ALTER TABLE public.resource_collections
  ADD CONSTRAINT fk_resource_collections_country
  FOREIGN KEY (country_code) REFERENCES geo.countries(code);

ALTER TABLE public.resource_files
  ADD CONSTRAINT fk_resource_files_country
  FOREIGN KEY (country_code) REFERENCES geo.countries(code);

ALTER TABLE public.resource_files_child
  ADD CONSTRAINT fk_resource_files_child_country
  FOREIGN KEY (country_code) REFERENCES geo.countries(code);

ALTER TABLE public.resource_links
  ADD CONSTRAINT fk_resource_links_country
  FOREIGN KEY (country_code) REFERENCES geo.countries(code);

COMMIT;



