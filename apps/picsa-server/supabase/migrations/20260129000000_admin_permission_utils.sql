-- ============================================================================
-- INDEX FOR FAST ROLE LOOKUPS
-- Critical for performance: avoids sequential scans on user_roles
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_roles_lookup 
ON public.user_roles(deployment_id, user_id);

-- Optional: covering index if roles array is small
CREATE INDEX IF NOT EXISTS idx_user_roles_covering 
ON public.user_roles(deployment_id, user_id) 
INCLUDE (roles);


-- ============================================================================
-- USER_IS_ADMIN()
-- 
-- Fast admin check with early returns. Optimized for hot path: global admin
-- is checked first (most permissive, fastest positive result).
-- 
-- PERFORMANCE NOTES:
-- - Single index scan on user_roles (O(log n))
-- - No row construction, minimal memory allocation
-- - Early return on global admin avoids module string concatenation
-- ============================================================================

CREATE OR REPLACE FUNCTION public.user_is_admin(
  p_deployment_id text,
  p_module text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE                    -- Critical: allows query planner to optimize
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_roles app_role[];
BEGIN
  -- Single index lookup
  SELECT roles INTO v_roles
  FROM public.user_roles
  WHERE deployment_id = p_deployment_id
    AND user_id = auth.uid();
  
  -- Hot path: no membership = fast reject
  IF v_roles IS NULL THEN
    RETURN false;
  END IF;
  
  -- Hot path: global admin = fast accept (no string ops)
  IF 'admin' = ANY(v_roles) THEN
    RETURN true;
  END IF;
  
  -- Cold path: module-specific check (only when p_module provided)
  IF p_module IS NOT NULL 
     AND (p_module || '.admin')::app_role = ANY(v_roles) 
  THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;


-- ============================================================================
-- USER_HAS_ROLE()
-- 
-- General role check with admin escalation. Used when specific non-admin
-- roles exist (e.g., 'climate.editor', 'forecasts.viewer').
-- 
-- PERFORMANCE NOTES:
-- - Same index efficiency as user_is_admin()
-- - Admin escalation checked before specific role (faster for admins)
-- - Module concat only when needed
-- ============================================================================

CREATE OR REPLACE FUNCTION public.user_has_role(
  p_deployment_id text,
  p_role app_role,
  p_module text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE                    -- Allows inlining and optimization
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
  
  -- Escalation: global admin
  IF 'admin' = ANY(v_roles) THEN
    RETURN true;
  END IF;
  
  -- Escalation: module admin (only if module context provided)
  IF p_module IS NOT NULL 
     AND (p_module || '.admin')::app_role = ANY(v_roles) 
  THEN
    RETURN true;
  END IF;
  
  -- Specific role match
  RETURN p_role = ANY(v_roles);
END;
$$;