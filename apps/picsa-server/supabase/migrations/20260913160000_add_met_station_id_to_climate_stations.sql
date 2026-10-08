-- Add met_station_id column to store national/climate service station identifiers (e.g. MSD Zimbabwe WMO index numbers)
ALTER TABLE public.climate_stations ADD COLUMN IF NOT EXISTS met_station_id text;

-- Create index to allow fast lookup by national met station ID
CREATE INDEX IF NOT EXISTS climate_stations_met_station_id_idx ON public.climate_stations (met_station_id);
