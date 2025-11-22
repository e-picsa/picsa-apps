alter type public.app_role ADD VALUE 'climate.viewer';
alter type public.app_role ADD VALUE 'climate.author';
alter type public.app_role ADD VALUE 'climate.admin';

-- Changle forecast location to simple string
ALTER TABLE public.forecasts DROP COLUMN location;
ALTER TABLE public.forecasts ADD COLUMN location text;

-- Allow forecasts to emit realtimie updates
alter publication supabase_realtime add table your_table_name;