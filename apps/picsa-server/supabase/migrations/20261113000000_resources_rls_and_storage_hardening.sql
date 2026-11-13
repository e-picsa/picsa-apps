-- ============================================================================
-- RESOURCES RLS, SCHEMA & STORAGE HARDENING
-- ============================================================================
-- 1. Hardens `public.user_is_global_admin()` to read `public.user_roles` via
--    `auth.uid()` with a fixed `search_path`, matching `user_has_role()` and
--    `user_has_country_role()`.
-- 2. Enforces single-country scoping (`country_code IS NOT NULL AND country_code <> 'global'`)
--    on `resource_collections`, `resource_files`, `resource_files_child`, and
--    `resource_links`, dropping legacy `'global'` column defaults.
-- 3. Allows any country `resources.editor` to update `resource_collections`
--    (collaborative editing of collection metadata/items), while preventing
--    non-admins from changing `owner` or `country_code` and keeping DELETE
--    restricted to row `owner` or `resources.admin`.
-- 4. Restricts `storage.objects` writes (INSERT/UPDATE/DELETE) on `mw`, `zm`, `zw`
--    to authenticated country editors/admins (`resources.*` or `climate.*`),
--    restricts `global` bucket writes to global admins, and removes legacy
--    public write policies and unused `resources` bucket policies.
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
-- 2. Schema constraints & defaults on resource tables (per-country only)
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

ALTER TABLE public.resource_collections
  DROP CONSTRAINT IF EXISTS resource_collections_country_code_not_global,
  ADD CONSTRAINT resource_collections_country_code_not_global
    CHECK (country_code <> 'global'::public.country_code);

ALTER TABLE public.resource_files
  DROP CONSTRAINT IF EXISTS resource_files_country_code_not_global,
  ADD CONSTRAINT resource_files_country_code_not_global
    CHECK (country_code <> 'global'::public.country_code);

ALTER TABLE public.resource_files_child
  DROP CONSTRAINT IF EXISTS resource_files_child_country_code_not_global,
  ADD CONSTRAINT resource_files_child_country_code_not_global
    CHECK (country_code <> 'global'::public.country_code);

ALTER TABLE public.resource_links
  DROP CONSTRAINT IF EXISTS resource_links_country_code_not_global,
  ADD CONSTRAINT resource_links_country_code_not_global
    CHECK (country_code <> 'global'::public.country_code);

-- ----------------------------------------------------------------------------
-- 3. `public.resource_collections` RLS + immutable owner/country_code guard
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
  AND country_code IS NOT NULL
  AND country_code <> 'global'::public.country_code
  AND public.user_has_country_role(country_code::text, 'resources.editor')
);

CREATE POLICY "resource_collections:update:editor" ON public.resource_collections
FOR UPDATE TO authenticated
USING (
  country_code IS NOT NULL
  AND country_code <> 'global'::public.country_code
  AND public.user_has_country_role(country_code::text, 'resources.editor')
)
WITH CHECK (
  country_code IS NOT NULL
  AND country_code <> 'global'::public.country_code
  AND public.user_has_country_role(country_code::text, 'resources.editor')
);

CREATE POLICY "resource_collections:delete:owner_or_admin" ON public.resource_collections
FOR DELETE TO authenticated
USING (
  country_code IS NOT NULL
  AND country_code <> 'global'::public.country_code
  AND (
    public.user_has_country_role(country_code::text, 'resources.admin')
    OR (auth.uid() = owner AND public.user_has_country_role(country_code::text, 'resources.editor'))
  )
);

CREATE OR REPLACE FUNCTION public.guard_resource_collection_immutable_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.user_has_country_role(OLD.country_code::text, 'resources.admin') THEN
    IF NEW.owner IS DISTINCT FROM OLD.owner THEN
      RAISE EXCEPTION 'Only resources.admin can change collection owner';
    END IF;
    IF NEW.country_code IS DISTINCT FROM OLD.country_code THEN
      RAISE EXCEPTION 'Only resources.admin can change collection country_code';
    END IF;
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
  AND country_code IS NOT NULL
  AND country_code <> 'global'::public.country_code
  AND public.user_has_country_role(country_code::text, 'resources.editor')
);

CREATE POLICY "resource_files:update:editor_owner_or_admin" ON public.resource_files
FOR UPDATE TO authenticated
USING (
  country_code IS NOT NULL
  AND country_code <> 'global'::public.country_code
  AND (
    public.user_has_country_role(country_code::text, 'resources.admin')
    OR (auth.uid() = owner AND public.user_has_country_role(country_code::text, 'resources.editor'))
  )
)
WITH CHECK (
  country_code IS NOT NULL
  AND country_code <> 'global'::public.country_code
  AND (
    public.user_has_country_role(country_code::text, 'resources.admin')
    OR (auth.uid() = owner AND public.user_has_country_role(country_code::text, 'resources.editor'))
  )
);

CREATE POLICY "resource_files:delete:editor_owner_or_admin" ON public.resource_files
FOR DELETE TO authenticated
USING (
  country_code IS NOT NULL
  AND country_code <> 'global'::public.country_code
  AND (
    public.user_has_country_role(country_code::text, 'resources.admin')
    OR (auth.uid() = owner AND public.user_has_country_role(country_code::text, 'resources.editor'))
  )
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
  AND country_code IS NOT NULL
  AND country_code <> 'global'::public.country_code
  AND public.user_has_country_role(country_code::text, 'resources.editor')
);

CREATE POLICY "resource_files_child:update:editor_owner_or_admin" ON public.resource_files_child
FOR UPDATE TO authenticated
USING (
  country_code IS NOT NULL
  AND country_code <> 'global'::public.country_code
  AND (
    public.user_has_country_role(country_code::text, 'resources.admin')
    OR (auth.uid() = owner AND public.user_has_country_role(country_code::text, 'resources.editor'))
  )
)
WITH CHECK (
  country_code IS NOT NULL
  AND country_code <> 'global'::public.country_code
  AND (
    public.user_has_country_role(country_code::text, 'resources.admin')
    OR (auth.uid() = owner AND public.user_has_country_role(country_code::text, 'resources.editor'))
  )
);

CREATE POLICY "resource_files_child:delete:editor_owner_or_admin" ON public.resource_files_child
FOR DELETE TO authenticated
USING (
  country_code IS NOT NULL
  AND country_code <> 'global'::public.country_code
  AND (
    public.user_has_country_role(country_code::text, 'resources.admin')
    OR (auth.uid() = owner AND public.user_has_country_role(country_code::text, 'resources.editor'))
  )
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
  AND country_code IS NOT NULL
  AND country_code <> 'global'::public.country_code
  AND public.user_has_country_role(country_code::text, 'resources.editor')
);

CREATE POLICY "resource_links:update:editor_owner_or_admin" ON public.resource_links
FOR UPDATE TO authenticated
USING (
  country_code IS NOT NULL
  AND country_code <> 'global'::public.country_code
  AND (
    public.user_has_country_role(country_code::text, 'resources.admin')
    OR (auth.uid() = owner AND public.user_has_country_role(country_code::text, 'resources.editor'))
  )
)
WITH CHECK (
  country_code IS NOT NULL
  AND country_code <> 'global'::public.country_code
  AND (
    public.user_has_country_role(country_code::text, 'resources.admin')
    OR (auth.uid() = owner AND public.user_has_country_role(country_code::text, 'resources.editor'))
  )
);

CREATE POLICY "resource_links:delete:editor_owner_or_admin" ON public.resource_links
FOR DELETE TO authenticated
USING (
  country_code IS NOT NULL
  AND country_code <> 'global'::public.country_code
  AND (
    public.user_has_country_role(country_code::text, 'resources.admin')
    OR (auth.uid() = owner AND public.user_has_country_role(country_code::text, 'resources.editor'))
  )
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

-- Restrict `global` bucket writes to global admins
DROP POLICY IF EXISTS "Storage global admin INSERT" ON storage.objects;
CREATE POLICY "Storage global admin INSERT" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'global'
  AND public.user_is_global_admin()
);

DROP POLICY IF EXISTS "Storage global admin UPDATE" ON storage.objects;
CREATE POLICY "Storage global admin UPDATE" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'global'
  AND public.user_is_global_admin()
)
WITH CHECK (
  bucket_id = 'global'
  AND public.user_is_global_admin()
);

DROP POLICY IF EXISTS "Storage global admin DELETE" ON storage.objects;
CREATE POLICY "Storage global admin DELETE" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'global'
  AND public.user_is_global_admin()
);

COMMIT;
