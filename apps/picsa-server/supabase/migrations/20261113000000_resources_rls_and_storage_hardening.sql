-- ============================================================================
-- RESOURCES RLS, SCHEMA & STORAGE HARDENING
-- ============================================================================
-- 1. Hardens `public.user_is_global_admin()` to read `public.user_roles` via
--    `auth.uid()` with a fixed `search_path`, matching `user_has_role()` and
--    `user_has_country_role()`.
-- 2. Requires explicit `country_code` on `resource_collections`, `resource_files`,
--    `resource_files_child`, and `resource_links` (drops legacy `'global'` column
--    defaults, adds `NOT NULL` where missing). Per-country values are enforced by
--    the app (dashboard always sends the active deployment country); there is no
--    DB-level `'global'` ban by design.
-- 3. Allows any country `resources.editor` to update `resource_collections`
--    (collaborative editing of collection metadata/items), while `owner` and
--    `country_code` stay immutable for all authenticated users and DELETE is
--    restricted to row `owner` or `resources.admin`.
-- 4. Restricts `storage.objects` writes (INSERT/UPDATE/DELETE) on `mw`, `zm`, `zw`
--    to authenticated country editors/admins (`resources.*` or `climate.*`),
--    leaves the `global` bucket with no authenticated write policies (read-only
--    via API), and removes legacy public write policies and unused `resources`
--    bucket policies.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Harden `public.user_is_global_admin()`
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.user_is_global_admin()
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
    WHERE ur.user_id = auth.uid()
      AND 'admin' = ANY(ur.roles)
  );
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. Explicit `country_code` on resource tables (no `'global'` default)
-- ----------------------------------------------------------------------------
ALTER TABLE public.resource_collections
  ALTER COLUMN country_code DROP DEFAULT,
  ALTER COLUMN country_code SET NOT NULL;

ALTER TABLE public.resource_files
  ALTER COLUMN country_code DROP DEFAULT;

ALTER TABLE public.resource_files_child
  ALTER COLUMN country_code DROP DEFAULT;

ALTER TABLE public.resource_links
  ALTER COLUMN country_code DROP DEFAULT,
  ALTER COLUMN country_code SET NOT NULL;

-- (No `'global'` CHECK by design: the app always sends the deployment country,
-- so `country_code` is constrained to NOT NULL + explicit value only.)

-- ----------------------------------------------------------------------------
-- 3. `public.resource_collections` RLS + immutable owner/country_code guard
-- Permissions: INSERT: country `resources.editor` (self as `owner`) |
-- UPDATE: any country `resources.editor` (collaborative) | DELETE: row `owner`
-- or country `resources.admin`. `owner`/`country_code` are immutable for every
-- authenticated user (no admin override); reassign via service_role or delete
-- + recreate.
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "resource_collections:create:editor" ON public.resource_collections;
DROP POLICY IF EXISTS "resource_collections:update:editor_owner_or_admin" ON public.resource_collections;
DROP POLICY IF EXISTS "resource_collections:update:editor" ON public.resource_collections;
DROP POLICY IF EXISTS "resource_collections:delete:editor_owner_or_admin" ON public.resource_collections;
DROP POLICY IF EXISTS "resource_collections:delete:owner_or_admin" ON public.resource_collections;

CREATE POLICY "resource_collections:create:editor" ON public.resource_collections
FOR INSERT TO authenticated
WITH CHECK (
  owner IS NOT NULL
  AND auth.uid() = owner
  AND public.user_has_country_role(country_code::text, 'resources.editor')
);

CREATE POLICY "resource_collections:update:editor" ON public.resource_collections
FOR UPDATE TO authenticated
USING (
  public.user_has_country_role(country_code::text, 'resources.editor')
)
WITH CHECK (
  public.user_has_country_role(country_code::text, 'resources.editor')
);

CREATE POLICY "resource_collections:delete:owner_or_admin" ON public.resource_collections
FOR DELETE TO authenticated
USING (
  public.user_has_country_role(country_code::text, 'resources.admin')
  OR (auth.uid() = owner AND public.user_has_country_role(country_code::text, 'resources.editor'))
);

CREATE OR REPLACE FUNCTION public.guard_resource_collection_immutable_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- service_role (migrations/seeds, `auth.uid()` NULL) bypasses; every
  -- authenticated user is blocked, including country admins.
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.owner IS DISTINCT FROM OLD.owner THEN
    RAISE EXCEPTION 'Collection owner is immutable (delete and recreate to reassign)';
  END IF;
  IF NEW.country_code IS DISTINCT FROM OLD.country_code THEN
    RAISE EXCEPTION 'Collection country_code is immutable (delete and recreate to move)';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_resource_collection_immutable_fields ON public.resource_collections;
CREATE TRIGGER guard_resource_collection_immutable_fields
BEFORE UPDATE ON public.resource_collections
FOR EACH ROW
EXECUTE FUNCTION public.guard_resource_collection_immutable_fields();

-- ----------------------------------------------------------------------------
-- 4. `public.resource_files`, `public.resource_files_child`, `public.resource_links` RLS
-- ----------------------------------------------------------------------------
-- 4a. resource_files
DROP POLICY IF EXISTS "resource_files:create:editor" ON public.resource_files;
DROP POLICY IF EXISTS "resource_files:update:editor_owner_or_admin" ON public.resource_files;
DROP POLICY IF EXISTS "resource_files:delete:editor_owner_or_admin" ON public.resource_files;

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

-- 4b. resource_files_child
DROP POLICY IF EXISTS "resource_files_child:create:editor" ON public.resource_files_child;
DROP POLICY IF EXISTS "resource_files_child:update:editor_owner_or_admin" ON public.resource_files_child;
DROP POLICY IF EXISTS "resource_files_child:delete:editor_owner_or_admin" ON public.resource_files_child;

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

-- 4c. resource_links
DROP POLICY IF EXISTS "resource_links:create:editor" ON public.resource_links;
DROP POLICY IF EXISTS "resource_links:update:editor_owner_or_admin" ON public.resource_links;
DROP POLICY IF EXISTS "resource_links:delete:editor_owner_or_admin" ON public.resource_links;

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
-- 5. Storage (`public.storage_objects` & `storage.objects`) hardening
-- ----------------------------------------------------------------------------
REVOKE INSERT, UPDATE, DELETE ON TABLE public.storage_objects FROM anon, authenticated;

-- Drop legacy unused `resources` bucket policies
DROP POLICY IF EXISTS "Storage resources public SELECT" ON storage.objects;
DROP POLICY IF EXISTS "Storage resources public INSERT" ON storage.objects;
DROP POLICY IF EXISTS "Storage resources public UPDATE" ON storage.objects;
DROP POLICY IF EXISTS "Storage resources public DELETE" ON storage.objects;

-- Drop overly permissive public write policies (keep public SELECT policies)
DROP POLICY IF EXISTS "Storage global public INSERT" ON storage.objects;
DROP POLICY IF EXISTS "Storage global public UPDATE" ON storage.objects;
DROP POLICY IF EXISTS "Storage global public DELETE" ON storage.objects;

DROP POLICY IF EXISTS "Storage mw public INSERT" ON storage.objects;
DROP POLICY IF EXISTS "Storage mw public UPDATE" ON storage.objects;
DROP POLICY IF EXISTS "Storage mw public DELETE" ON storage.objects;

DROP POLICY IF EXISTS "Storage zm public INSERT" ON storage.objects;
DROP POLICY IF EXISTS "Storage zm public UPDATE" ON storage.objects;
DROP POLICY IF EXISTS "Storage zm public DELETE" ON storage.objects;

DROP POLICY IF EXISTS "Storage zw public INSERT" ON storage.objects;
DROP POLICY IF EXISTS "Storage zw public UPDATE" ON storage.objects;
DROP POLICY IF EXISTS "Storage zw public DELETE" ON storage.objects;

-- Replace with role-scoped authenticated write policies on country buckets
DROP POLICY IF EXISTS "Storage country authenticated INSERT" ON storage.objects;
CREATE POLICY "Storage country authenticated INSERT" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id IN ('mw', 'zm', 'zw')
  AND (
    public.user_has_country_role(bucket_id, 'resources.editor')
    OR public.user_has_country_role(bucket_id, 'climate.editor')
  )
);

DROP POLICY IF EXISTS "Storage country authenticated UPDATE" ON storage.objects;
CREATE POLICY "Storage country authenticated UPDATE" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id IN ('mw', 'zm', 'zw')
  AND (
    public.user_has_country_role(bucket_id, 'resources.admin')
    OR public.user_has_country_role(bucket_id, 'climate.admin')
    OR (
      auth.uid() = owner
      AND (
        public.user_has_country_role(bucket_id, 'resources.editor')
        OR public.user_has_country_role(bucket_id, 'climate.editor')
      )
    )
  )
)
WITH CHECK (
  bucket_id IN ('mw', 'zm', 'zw')
  AND (
    public.user_has_country_role(bucket_id, 'resources.admin')
    OR public.user_has_country_role(bucket_id, 'climate.admin')
    OR (
      auth.uid() = owner
      AND (
        public.user_has_country_role(bucket_id, 'resources.editor')
        OR public.user_has_country_role(bucket_id, 'climate.editor')
      )
    )
  )
);

DROP POLICY IF EXISTS "Storage country authenticated DELETE" ON storage.objects;
CREATE POLICY "Storage country authenticated DELETE" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id IN ('mw', 'zm', 'zw')
  AND (
    public.user_has_country_role(bucket_id, 'resources.admin')
    OR public.user_has_country_role(bucket_id, 'climate.admin')
    OR (
      auth.uid() = owner
      AND (
        public.user_has_country_role(bucket_id, 'resources.editor')
        OR public.user_has_country_role(bucket_id, 'climate.editor')
      )
    )
  )
);

-- `global` bucket: no authenticated write policies by design (read-only via API;
-- seeds/migrations write via service_role, which bypasses RLS). The pre-existing
-- `Storage global public SELECT` policy is untouched, so anyone can still read.

COMMIT;
