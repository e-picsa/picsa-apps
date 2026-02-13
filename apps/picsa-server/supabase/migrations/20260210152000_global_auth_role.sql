-- Helper function to check for admin role in JWT
-- Named user_is_global_admin to distinguishing from table-based user_is_admin
CREATE OR REPLACE FUNCTION public.user_is_global_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_jwt jsonb := auth.jwt();
  v_roles jsonb;
  v_key text;
BEGIN
  -- Check if JWT exists
  IF v_jwt IS NULL THEN
    RETURN false;
  END IF;

  -- "picsa_roles" custom claim (top-level or inside app_metadata)
  v_roles := COALESCE(v_jwt -> 'picsa_roles', v_jwt -> 'app_metadata' -> 'picsa_roles');

  -- If no roles, return false
  IF v_roles IS NULL OR jsonb_typeof(v_roles) != 'object' THEN
    RETURN false;
  END IF;

  -- Iterate through each deployment's roles
  FOR v_key IN SELECT * FROM jsonb_object_keys(v_roles)
  LOOP
    -- Check if 'admin' role exists in the array
    IF (v_roles -> v_key) @> '"admin"' THEN
      RETURN true;
    END IF;
  END LOOP;

  RETURN false;
END;
$$;
