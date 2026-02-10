-- Refactor the `app_role` enum type to remove roles not in use
-- e.g. `viewer`, `climate.author`, also rename feature author roles to `editor`

BEGIN;

-- 0. Clean up legacy 'viewer' role from data
UPDATE public.user_roles
SET roles = array_remove(roles, 'viewer'::app_role)
WHERE 'viewer'::app_role = ANY(roles);

-- 1. Rename existing enum
ALTER TYPE app_role RENAME TO app_role_old;

-- 2. Create new enum with desired values
CREATE TYPE app_role AS ENUM (
    'admin',
    'climate.admin',
    'crop.admin',
    'monitoring.admin',
    'resources.admin',
    'resources.editor',
    'deployments.admin',
    'translations.admin',
    'translations.editor'
);

-- 3. Alter table column(s)
ALTER TABLE public.user_roles
  ALTER COLUMN roles DROP DEFAULT;

ALTER TABLE public.user_roles
  ALTER COLUMN roles TYPE app_role[]
  USING roles::text[]::app_role[];

ALTER TABLE public.user_roles
  ALTER COLUMN roles SET DEFAULT array[]::app_role[];

-- 4. Recreate the function with the new type
DROP FUNCTION public.user_has_role(text, app_role_old, text);

CREATE OR REPLACE FUNCTION public.user_has_role(
  p_deployment_id text,
  p_role app_role,
  p_module text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_roles app_role[];
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
  
  -- 3. Implicit Editor Access: feature.admin implies feature.editor
  -- If the requested role is an editor role, check if the user has the corresponding admin role
  IF p_role::text LIKE '%.editor' THEN
    IF (split_part(p_role::text, '.', 1) || '.admin') = ANY(v_roles::text[]) THEN
      RETURN true;
    END IF;
  END IF;
  
  RETURN false;
END;
$$;

-- 5. Now safe to drop old enum
DROP TYPE app_role_old;

COMMIT;