---------------- Examples   ---------------------------------------
-- See https://docs.picsa.app/server/database/security

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

-- Authenticated - read, write (admin)
REVOKE ALL ON TABLE public.climate_stations FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.climate_stations TO authenticated;

CREATE POLICY "climate_stations:read:authenticated" ON public.climate_stations
FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "climate_stations:write:admin" ON public.climate_stations
FOR ALL TO authenticated
-- NOTE - assumes country_code matches deployment id
USING (public.user_is_admin(country_code, 'climate'))
WITH CHECK (public.user_is_admin(country_code, 'climate'));

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

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Authenticated - read-owner_only
REVOKE ALL ON TABLE public.user_roles FROM authenticated;
GRANT SELECT ON TABLE public.user_roles TO authenticated;

CREATE POLICY "user_roles:select:owner_only" ON public.user_roles
FOR SELECT
TO authenticated USING ( auth.uid() = user_id);

-- Anonymous - no access
REVOKE ALL ON TABLE public.user_roles FROM anon;



-- TODO
-- Most tables could be controlled via cloud functions to avoid authenticated permissions