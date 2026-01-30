---------------- Examples   ---------------------------------------

-- Audit

-- SELECT audit.enable_table_audit(
--     'public',                -- schema
--     'climate_station_data',  -- table
--     'station_id',            -- PK column
--     ARRAY['updated_at']      -- excluded columns (ignored in diffs)
-- );


-- -- Table-Level Priviledges

-- ALTER TABLE public.climate_station_data ENABLE ROW LEVEL SECURITY;
-- GRANT ALL ON TABLE public.climate_station_data to supabase_auth_admin;

-- -- Allow authenticated users to read/write
-- GRANT SELECT, INSERT, UPDATE,
-- ON TABLE public.climate_station_data
-- TO authenticated;

-- -- RLS Policies
-- -- 

-- CREATE POLICY "Enable full access for authenticated users"
-- ON public.climate_station_data
-- FOR ALL
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);


---------------- climate_station_data   ---------------------------------------

-- Enable RLS
ALTER TABLE public.climate_station_data ENABLE ROW LEVEL SECURITY;

-- Authenticated - read/write
REVOKE ALL ON TABLE public.climate_station_data FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.climate_station_data TO authenticated;

CREATE POLICY "climate_station_data:read_write:authenticated" ON public.climate_station_data
FOR ALL
TO authenticated USING (true) WITH CHECK (true);

-- Anonymous - none
REVOKE ALL ON TABLE public.climate_station_data FROM anon;



---------------- climate_stations   ---------------------------------------

-- Enable RLS
ALTER TABLE public.climate_stations ENABLE ROW LEVEL SECURITY;

-- Authenticated - read/write
REVOKE ALL ON TABLE public.climate_stations FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.climate_stations TO authenticated;

CREATE POLICY "climate_stations:read_write:authenticated" ON public.climate_stations
FOR ALL
TO authenticated USING (true) WITH CHECK (true);

-- Anonymous - none
REVOKE ALL ON TABLE public.climate_stations FROM anon;

---------------- crop_data   ---------------------------------------

-- Enable RLS
ALTER TABLE public.crop_data ENABLE ROW LEVEL SECURITY;

-- Authenticated - read/write
REVOKE ALL ON TABLE public.crop_data FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.crop_data TO authenticated;

CREATE POLICY "crop_data:read_write:authenticated" ON public.crop_data
FOR ALL
TO authenticated USING (true) WITH CHECK (true);

-- Anonymous - none
REVOKE ALL ON TABLE public.crop_data FROM anon;

---------------- crop_data_downscaled   ---------------------------------------

-- Enable RLS
ALTER TABLE public.crop_data_downscaled ENABLE ROW LEVEL SECURITY;

-- Authenticated - read/write
REVOKE ALL ON TABLE public.crop_data_downscaled FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.crop_data_downscaled TO authenticated;

CREATE POLICY "crop_data_downscaled:read_write:authenticated" ON public.crop_data_downscaled
FOR ALL
TO authenticated USING (true) WITH CHECK (true);

-- Anonymous - none
REVOKE ALL ON TABLE public.crop_data_downscaled FROM anon;

---------------- forecasts   ---------------------------------------

-- Enable RLS
ALTER TABLE public.forecasts ENABLE ROW LEVEL SECURITY;

-- Authenticated - read/write
REVOKE ALL ON TABLE public.forecasts FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.forecasts TO authenticated;

CREATE POLICY "forecasts:read_write:authenticated" ON public.forecasts
FOR ALL
TO authenticated USING (true) WITH CHECK (true);

-- Anonymous - read-only
REVOKE ALL ON TABLE public.forecasts FROM anon;
GRANT SELECT ON TABLE public.forecasts TO anon;

CREATE POLICY "forecasts:read:anon" ON public.forecasts
FOR ALL
TO anon USING (true) WITH CHECK (true);

---------------- User Roles   ---------------------------------------
-- Accessed via cloud functions, revoke all other access 

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

REVOKE ALL
ON TABLE public.user_roles
FROM anon, authenticated;



-- TODO
-- Most tables could be controlled via cloud functions to avoid authenticated permissions