-- Add country_code column without a default
ALTER TABLE public.crop_data ADD COLUMN country_code text;

-- Populate existing rows with 'zm'
UPDATE public.crop_data SET country_code = 'zm' WHERE country_code IS NULL;

-- Enforce NOT NULL constraint on country_code
ALTER TABLE public.crop_data ALTER COLUMN country_code SET NOT NULL;

-- Drop old primary key constraint and generated id column
ALTER TABLE public.crop_data DROP CONSTRAINT IF EXISTS crop_data_id_key;
ALTER TABLE public.crop_data DROP CONSTRAINT IF EXISTS crop_data_pkey;
ALTER TABLE public.crop_data DROP COLUMN IF EXISTS id;

-- Re-add id column generated as NOT NULL (country_code || '/' || crop || '/' || variety)
ALTER TABLE public.crop_data ADD COLUMN id text NOT NULL GENERATED ALWAYS AS (country_code || '/' || crop || '/' || variety) STORED;

-- Add primary key and unique constraint
ALTER TABLE public.crop_data ADD CONSTRAINT crop_data_pkey PRIMARY KEY (country_code, crop, variety);
ALTER TABLE public.crop_data ADD CONSTRAINT crop_data_id_key UNIQUE (id);
