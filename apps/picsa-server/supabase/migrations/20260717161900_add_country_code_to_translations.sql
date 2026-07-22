-- Add country_code column referencing the existing country_code enum type
ALTER TABLE public.translations ADD COLUMN country_code public.country_code;

-- Drop the old unique constraint
ALTER TABLE public.translations DROP CONSTRAINT IF EXISTS translations_tool_context_en_key;
