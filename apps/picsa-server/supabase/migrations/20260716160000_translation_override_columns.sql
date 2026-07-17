-- Add English override columns
ALTER TABLE public.translations ADD COLUMN IF NOT EXISTS mw_en text;
ALTER TABLE public.translations ADD COLUMN IF NOT EXISTS zm_en text;
ALTER TABLE public.translations ADD COLUMN IF NOT EXISTS zw_en text;
