-- Each comment includes station_id, chart_name, date_created, created_by and comment text
-- Note: climate_summary_rainfall was replaced with climate_station_data in 20250622173800

-- Only add column if it doesn't already exist
ALTER TABLE public.climate_station_data
ADD COLUMN IF NOT EXISTS comments jsonb[] NOT NULL DEFAULT '{}';


COMMENT ON COLUMN public.climate_station_data.comments IS 'Array of user feedback comments, each containing: station_id, chart_name, date_created, created_by, comment, and resolved status';