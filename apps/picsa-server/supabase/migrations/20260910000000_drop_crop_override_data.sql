-- Drop override_data column as crop definitions are now scoped per-country
ALTER TABLE public.crop_data_downscaled DROP COLUMN IF EXISTS override_data;
