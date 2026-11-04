-- ============================================================================
-- ROLE ENUM UPDATES & COMPREHENSIVE ROW-LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
-- 1. Updates `public.app_role` enum:
--    - Removes deprecated 'monitoring.admin'
--    - Adds 'climate.editor' and 'crop.editor' alongside 'climate.admin' and 'crop.admin'
-- 2. Adds `public.user_has_country_role` helper to evaluate roles on country-scoped tables
--    (and global rows) with automatic admin -> editor escalation.
-- 3. Ensures public read (SELECT) access for `anon` and `authenticated` on content tables
--    so unauthenticated web app users and anonymous mobile app users can safely read.
-- 4. Restricts INSERT, UPDATE, and DELETE on content tables to appropriate editor/admin roles
--    (and row owners for `resources.editor`).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 0. Drop policies that depend on `public.user_has_role` before replacing enum
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view access requests for their deployments" ON public.deployment_access_requests;
DROP POLICY IF EXISTS "Admins can update access requests for their deployments" ON public.deployment_access_requests;

-- ----------------------------------------------------------------------------
-- 1. Clean up deprecated 'monitoring.admin' role from existing data
-- ----------------------------------------------------------------------------
UPDATE public.user_roles
SET roles = array_remove(roles, 'monitoring.admin'::public.app_role)
WHERE 'monitoring.admin'::public.app_role = ANY(roles);

-- ----------------------------------------------------------------------------
-- 2. Recreate `public.app_role` enum with `climate.editor` and `crop.editor`
-- ----------------------------------------------------------------------------
ALTER TYPE public.app_role RENAME TO app_role_old;

CREATE TYPE public.app_role AS ENUM (
  'admin',
  'deployments.admin',
  'climate.admin',
  'climate.editor',
  'crop.admin',
  'crop.editor',
  'resources.admin',
  'resources.editor',
  'translations.admin',
  'translations.editor',
  'app.admin'
);

ALTER TABLE public.user_roles
  ALTER COLUMN roles DROP DEFAULT;

ALTER TABLE public.user_roles
  ALTER COLUMN roles TYPE public.app_role[]
  USING roles::text[]::public.app_role[];

ALTER TABLE public.user_roles
  ALTER COLUMN roles SET DEFAULT array[]::public.app_role[];

-- ----------------------------------------------------------------------------
-- 3. Recreate role check functions with the updated `public.app_role` type
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.user_has_role(text, public.app_role_old, text);
DROP FUNCTION IF EXISTS public.user_is_admin(text, text);

CREATE OR REPLACE FUNCTION public.user_is_admin(
  p_deployment_id text,
  p_module text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_roles public.app_role[];
BEGIN
  SELECT roles INTO v_roles
  FROM public.user_roles
  WHERE deployment_id = p_deployment_id
    AND user_id = auth.uid();

  IF v_roles IS NULL THEN
    RETURN false;
  END IF;

  IF 'admin' = ANY(v_roles) OR 'deployments.admin' = ANY(v_roles) THEN
    RETURN true;
  END IF;

  IF p_module IS NOT NULL
     AND (p_module || '.admin')::public.app_role = ANY(v_roles)
  THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.user_has_role(
  p_deployment_id text,
  p_role public.app_role,
  p_module text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_roles public.app_role[];
BEGIN
  SELECT roles INTO v_roles
  FROM public.user_roles
  WHERE deployment_id = p_deployment_id
    AND user_id = auth.uid();

  IF v_roles IS NULL THEN
    RETURN false;
  END IF;

  -- 1. Global Admin & Deployments Admin have access to everything
  IF 'admin' = ANY(v_roles) OR 'deployments.admin' = ANY(v_roles) THEN
    RETURN true;
  END IF;

  -- 2. Exact role match
  IF p_role = ANY(v_roles) THEN
    RETURN true;
  END IF;

  -- 3. Module admin escalation when module context is explicitly provided
  IF p_module IS NOT NULL
     AND (p_module || '.admin') = ANY(v_roles::text[])
  THEN
    RETURN true;
  END IF;

  -- 4. Implicit Editor Access: feature.admin implies feature.editor
  IF p_role::text LIKE '%.editor' THEN
    IF (split_part(p_role::text, '.', 1) || '.admin') = ANY(v_roles::text[]) THEN
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$$;

-- Helper for tables keyed by `country_code` rather than `deployment_id`.
-- Evaluates whether the current user holds `p_role` (or its escalated admin role)
-- on any deployment matching `p_country_code` (or any deployment when `p_country_code`
-- is NULL or `'global'`, which is used for shared cross-country taxonomy such as
-- `resource_collections` and shared base `translations` rows).
CREATE OR REPLACE FUNCTION public.user_has_country_role(
  p_country_code text,
  p_role public.app_role
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.deployments d ON d.id = ur.deployment_id
    WHERE ur.user_id = auth.uid()
      AND (
        'admin' = ANY(ur.roles)
        OR (
          (p_country_code IS NULL OR p_country_code = 'global' OR d.country_code::text = p_country_code)
          AND (
            'deployments.admin' = ANY(ur.roles)
            OR p_role = ANY(ur.roles)
            OR (
              p_role::text LIKE '%.editor'
              AND (split_part(p_role::text, '.', 1) || '.admin') = ANY(ur.roles::text[])
            )
          )
        )
      )
  );
END;
$$;

DROP TYPE public.app_role_old;

-- Restore policies on deployment_access_requests
CREATE POLICY "Admins can view access requests for their deployments"
ON public.deployment_access_requests
FOR SELECT
TO authenticated
USING (public.user_has_role(deployment_id, 'deployments.admin'));

CREATE POLICY "Admins can update access requests for their deployments"
ON public.deployment_access_requests
FOR UPDATE
TO authenticated
USING (public.user_has_role(deployment_id, 'deployments.admin'));

-- ----------------------------------------------------------------------------
-- 4. Climate Tables (`climate_stations`, `climate_station_data`, `forecasts`)
--    - Read: `anon` and `authenticated`
--    - Write on `forecasts`: `climate.editor` (or edge function service_role)
--    - Write on `climate_stations` / `climate_station_data`: via edge functions (`service_role`)
-- ----------------------------------------------------------------------------
ALTER TABLE public.climate_stations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.climate_stations FROM anon, authenticated;
GRANT SELECT ON TABLE public.climate_stations TO anon, authenticated;

DROP POLICY IF EXISTS "climate_stations:read:authenticated" ON public.climate_stations;
DROP POLICY IF EXISTS "climate_stations:read:public" ON public.climate_stations;
CREATE POLICY "climate_stations:read:public" ON public.climate_stations
FOR SELECT TO anon, authenticated
USING (true);

ALTER TABLE public.climate_station_data ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.climate_station_data FROM anon, authenticated;
GRANT SELECT ON TABLE public.climate_station_data TO anon, authenticated;

DROP POLICY IF EXISTS "climate_station_data:read:authenticated" ON public.climate_station_data;
DROP POLICY IF EXISTS "climate_station_data:read:public" ON public.climate_station_data;
CREATE POLICY "climate_station_data:read:public" ON public.climate_station_data
FOR SELECT TO anon, authenticated
USING (true);

ALTER TABLE public.forecasts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.forecasts FROM anon, authenticated;
GRANT SELECT ON TABLE public.forecasts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.forecasts TO authenticated;

DROP POLICY IF EXISTS "forecasts:read:anon" ON public.forecasts;
DROP POLICY IF EXISTS "forecasts:read_write:authenticated" ON public.forecasts;
DROP POLICY IF EXISTS "forecasts:read:public" ON public.forecasts;
DROP POLICY IF EXISTS "forecasts:write:editor" ON public.forecasts;

CREATE POLICY "forecasts:read:public" ON public.forecasts
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "forecasts:insert:editor" ON public.forecasts
FOR INSERT TO authenticated
WITH CHECK (public.user_has_country_role(country_code::text, 'climate.editor'));

CREATE POLICY "forecasts:update:editor" ON public.forecasts
FOR UPDATE TO authenticated
USING (public.user_has_country_role(country_code::text, 'climate.editor'))
WITH CHECK (public.user_has_country_role(country_code::text, 'climate.editor'));

CREATE POLICY "forecasts:delete:editor" ON public.forecasts
FOR DELETE TO authenticated
USING (public.user_has_country_role(country_code::text, 'climate.editor'));

-- ----------------------------------------------------------------------------
-- 5. Crop Tables (`crop_data`, `crop_data_downscaled`)
--    - Read: `anon` and `authenticated`
--    - Write: `crop.editor` (includes `crop.admin` via escalation)
-- ----------------------------------------------------------------------------
ALTER TABLE public.crop_data ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.crop_data FROM anon, authenticated;
GRANT SELECT ON TABLE public.crop_data TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.crop_data TO authenticated;

DROP POLICY IF EXISTS "crop_data:read_write:authenticated" ON public.crop_data;
DROP POLICY IF EXISTS "crop_data:read:public" ON public.crop_data;

CREATE POLICY "crop_data:read:public" ON public.crop_data
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "crop_data:insert:editor" ON public.crop_data
FOR INSERT TO authenticated
WITH CHECK (public.user_has_country_role(country_code::text, 'crop.editor'));

CREATE POLICY "crop_data:update:editor" ON public.crop_data
FOR UPDATE TO authenticated
USING (public.user_has_country_role(country_code::text, 'crop.editor'))
WITH CHECK (public.user_has_country_role(country_code::text, 'crop.editor'));

CREATE POLICY "crop_data:delete:editor" ON public.crop_data
FOR DELETE TO authenticated
USING (public.user_has_country_role(country_code::text, 'crop.editor'));

ALTER TABLE public.crop_data_downscaled ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.crop_data_downscaled FROM anon, authenticated;
GRANT SELECT ON TABLE public.crop_data_downscaled TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.crop_data_downscaled TO authenticated;

DROP POLICY IF EXISTS "crop_data_downscaled:read_write:authenticated" ON public.crop_data_downscaled;
DROP POLICY IF EXISTS "crop_data_downscaled:read:public" ON public.crop_data_downscaled;

CREATE POLICY "crop_data_downscaled:read:public" ON public.crop_data_downscaled
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "crop_data_downscaled:insert:editor" ON public.crop_data_downscaled
FOR INSERT TO authenticated
WITH CHECK (public.user_has_country_role(country_code::text, 'crop.editor'));

CREATE POLICY "crop_data_downscaled:update:editor" ON public.crop_data_downscaled
FOR UPDATE TO authenticated
USING (public.user_has_country_role(country_code::text, 'crop.editor'))
WITH CHECK (public.user_has_country_role(country_code::text, 'crop.editor'));

CREATE POLICY "crop_data_downscaled:delete:editor" ON public.crop_data_downscaled
FOR DELETE TO authenticated
USING (public.user_has_country_role(country_code::text, 'crop.editor'));

-- ----------------------------------------------------------------------------
-- 6. Resources Tables (`resource_collections`, `resource_files`, `resource_files_child`, `resource_links`)
--    - Read: `anon` and `authenticated`
--    - Insert: `resources.editor` (with `owner = auth.uid()`)
--    - Update / Delete: `resources.editor` on own rows (`owner = auth.uid()`), OR `resources.admin` on any row
-- ----------------------------------------------------------------------------
-- 6a. resource_collections
ALTER TABLE public.resource_collections ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.resource_collections FROM anon, authenticated;
GRANT SELECT ON TABLE public.resource_collections TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.resource_collections TO authenticated;

DROP POLICY IF EXISTS "resource_collections:read:authenticated" ON public.resource_collections;
DROP POLICY IF EXISTS "resource_collections:create:authenticated" ON public.resource_collections;
DROP POLICY IF EXISTS "resource_collections:update:owner_only" ON public.resource_collections;
DROP POLICY IF EXISTS "resource_collections:delete:owner_only" ON public.resource_collections;

CREATE POLICY "resource_collections:read:public" ON public.resource_collections
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "resource_collections:create:editor" ON public.resource_collections
FOR INSERT TO authenticated
WITH CHECK (
  owner IS NOT NULL
  AND auth.uid() = owner
  AND public.user_has_country_role('global', 'resources.editor')
);

CREATE POLICY "resource_collections:update:editor_owner_or_admin" ON public.resource_collections
FOR UPDATE TO authenticated
USING (
  public.user_has_country_role('global', 'resources.admin')
  OR (auth.uid() = owner AND public.user_has_country_role('global', 'resources.editor'))
)
WITH CHECK (
  public.user_has_country_role('global', 'resources.admin')
  OR (auth.uid() = owner AND public.user_has_country_role('global', 'resources.editor'))
);

CREATE POLICY "resource_collections:delete:editor_owner_or_admin" ON public.resource_collections
FOR DELETE TO authenticated
USING (
  public.user_has_country_role('global', 'resources.admin')
  OR (auth.uid() = owner AND public.user_has_country_role('global', 'resources.editor'))
);

-- 6b. resource_files
ALTER TABLE public.resource_files ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.resource_files FROM anon, authenticated;
GRANT SELECT ON TABLE public.resource_files TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.resource_files TO authenticated;

DROP POLICY IF EXISTS "resource_files:read:authenticated" ON public.resource_files;
DROP POLICY IF EXISTS "resource_files:create:authenticated" ON public.resource_files;
DROP POLICY IF EXISTS "resource_files:update:owner_only" ON public.resource_files;
DROP POLICY IF EXISTS "resource_files:delete:owner_only" ON public.resource_files;

CREATE POLICY "resource_files:read:public" ON public.resource_files
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "resource_files:create:editor" ON public.resource_files
FOR INSERT TO authenticated
WITH CHECK (
  owner IS NOT NULL
  AND auth.uid() = owner
  AND public.user_has_country_role(country_code::text, 'resources.editor')
);

CREATE POLICY "resource_files:update:editor_owner_or_admin" ON public.resource_files
FOR UPDATE TO authenticated
USING (
  public.user_has_country_role(country_code::text, 'resources.admin')
  OR (auth.uid() = owner AND public.user_has_country_role(country_code::text, 'resources.editor'))
)
WITH CHECK (
  public.user_has_country_role(country_code::text, 'resources.admin')
  OR (auth.uid() = owner AND public.user_has_country_role(country_code::text, 'resources.editor'))
);

CREATE POLICY "resource_files:delete:editor_owner_or_admin" ON public.resource_files
FOR DELETE TO authenticated
USING (
  public.user_has_country_role(country_code::text, 'resources.admin')
  OR (auth.uid() = owner AND public.user_has_country_role(country_code::text, 'resources.editor'))
);

-- 6c. resource_files_child
ALTER TABLE public.resource_files_child ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.resource_files_child FROM anon, authenticated;
GRANT SELECT ON TABLE public.resource_files_child TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.resource_files_child TO authenticated;

DROP POLICY IF EXISTS "resource_files_child:read:authenticated" ON public.resource_files_child;
DROP POLICY IF EXISTS "resource_files_child:create:authenticated" ON public.resource_files_child;
DROP POLICY IF EXISTS "resource_files_child:update:owner_only" ON public.resource_files_child;
DROP POLICY IF EXISTS "resource_files_child:delete:owner_only" ON public.resource_files_child;

CREATE POLICY "resource_files_child:read:public" ON public.resource_files_child
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "resource_files_child:create:editor" ON public.resource_files_child
FOR INSERT TO authenticated
WITH CHECK (
  owner IS NOT NULL
  AND auth.uid() = owner
  AND public.user_has_country_role(country_code::text, 'resources.editor')
);

CREATE POLICY "resource_files_child:update:editor_owner_or_admin" ON public.resource_files_child
FOR UPDATE TO authenticated
USING (
  public.user_has_country_role(country_code::text, 'resources.admin')
  OR (auth.uid() = owner AND public.user_has_country_role(country_code::text, 'resources.editor'))
)
WITH CHECK (
  public.user_has_country_role(country_code::text, 'resources.admin')
  OR (auth.uid() = owner AND public.user_has_country_role(country_code::text, 'resources.editor'))
);

CREATE POLICY "resource_files_child:delete:editor_owner_or_admin" ON public.resource_files_child
FOR DELETE TO authenticated
USING (
  public.user_has_country_role(country_code::text, 'resources.admin')
  OR (auth.uid() = owner AND public.user_has_country_role(country_code::text, 'resources.editor'))
);

-- 6d. resource_links
ALTER TABLE public.resource_links ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.resource_links FROM anon, authenticated;
GRANT SELECT ON TABLE public.resource_links TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.resource_links TO authenticated;

DROP POLICY IF EXISTS "resource_links:read:authenticated" ON public.resource_links;
DROP POLICY IF EXISTS "resource_links:create:authenticated" ON public.resource_links;
DROP POLICY IF EXISTS "resource_links:update:owner_only" ON public.resource_links;
DROP POLICY IF EXISTS "resource_links:delete:owner_only" ON public.resource_links;

CREATE POLICY "resource_links:read:public" ON public.resource_links
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "resource_links:create:editor" ON public.resource_links
FOR INSERT TO authenticated
WITH CHECK (
  owner IS NOT NULL
  AND auth.uid() = owner
  AND public.user_has_country_role(country_code::text, 'resources.editor')
);

CREATE POLICY "resource_links:update:editor_owner_or_admin" ON public.resource_links
FOR UPDATE TO authenticated
USING (
  public.user_has_country_role(country_code::text, 'resources.admin')
  OR (auth.uid() = owner AND public.user_has_country_role(country_code::text, 'resources.editor'))
)
WITH CHECK (
  public.user_has_country_role(country_code::text, 'resources.admin')
  OR (auth.uid() = owner AND public.user_has_country_role(country_code::text, 'resources.editor'))
);

CREATE POLICY "resource_links:delete:editor_owner_or_admin" ON public.resource_links
FOR DELETE TO authenticated
USING (
  public.user_has_country_role(country_code::text, 'resources.admin')
  OR (auth.uid() = owner AND public.user_has_country_role(country_code::text, 'resources.editor'))
);

-- ----------------------------------------------------------------------------
-- 7. Translations Table (`translations`)
--    - Read: `anon` and `authenticated`
--    - Write: `translations.editor` (includes `translations.admin` via escalation)
-- ----------------------------------------------------------------------------
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.translations FROM anon, authenticated;
GRANT SELECT ON TABLE public.translations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.translations TO authenticated;

DROP POLICY IF EXISTS "translations:read:authenticated" ON public.translations;
DROP POLICY IF EXISTS "translations:create:authenticated" ON public.translations;
DROP POLICY IF EXISTS "translations:update:authenticated" ON public.translations;

CREATE POLICY "translations:read:public" ON public.translations
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "translations:create:editor" ON public.translations
FOR INSERT TO authenticated
WITH CHECK (public.user_has_country_role(country_code::text, 'translations.editor'));

CREATE POLICY "translations:update:editor" ON public.translations
FOR UPDATE TO authenticated
USING (public.user_has_country_role(country_code::text, 'translations.editor'))
WITH CHECK (public.user_has_country_role(country_code::text, 'translations.editor'));

CREATE POLICY "translations:delete:admin" ON public.translations
FOR DELETE TO authenticated
USING (public.user_has_country_role(country_code::text, 'translations.admin'));

-- ----------------------------------------------------------------------------
-- 8. Geo Boundaries (`geo.boundaries`)
--    - Allow `app.admin` to update boundary labels from `/map-admin`
-- ----------------------------------------------------------------------------
GRANT UPDATE (label, updated_at) ON TABLE geo.boundaries TO authenticated;

DROP POLICY IF EXISTS "Allow app.admin update access" ON geo.boundaries;
CREATE POLICY "Allow app.admin update access" ON geo.boundaries
FOR UPDATE TO authenticated
USING (public.user_has_country_role(lower(country_code), 'app.admin'))
WITH CHECK (public.user_has_country_role(lower(country_code), 'app.admin'));

COMMIT;
