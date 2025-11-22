alter type public.app_role ADD VALUE 'climate.viewer';
alter type public.app_role ADD VALUE 'climate.author';
alter type public.app_role ADD VALUE 'climate.admin';

-- Prefer using simple downscaled_location single string instead of location array
ALTER TABLE public.forecasts ADD COLUMN downscaled_location text;

-- Allow forecasts to emit realtimie updates
alter publication supabase_realtime add table forecasts;