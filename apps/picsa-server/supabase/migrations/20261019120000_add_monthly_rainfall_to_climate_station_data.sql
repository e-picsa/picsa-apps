-- Add monthly rainfall summary storage, sourced from /v2/monthly_rainfall_summaries/
ALTER TABLE public.climate_station_data ADD COLUMN IF NOT EXISTS monthly_rainfall_data jsonb[];
ALTER TABLE public.climate_station_data ADD COLUMN IF NOT EXISTS monthly_rainfall_metadata jsonb;
