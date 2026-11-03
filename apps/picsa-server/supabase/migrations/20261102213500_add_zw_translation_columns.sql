-- Add Zimbabwe locale codes to legacy locale_code enum
ALTER TYPE public.locale_code ADD VALUE IF NOT EXISTS 'zw_en';
ALTER TYPE public.locale_code ADD VALUE IF NOT EXISTS 'zw_sn';
ALTER TYPE public.locale_code ADD VALUE IF NOT EXISTS 'zw_nd';

-- Add Zimbabwe translation columns (Shona and Ndebele) to translations table
ALTER TABLE public.translations
  ADD COLUMN IF NOT EXISTS zw_sn text,
  ADD COLUMN IF NOT EXISTS zw_nd text;
