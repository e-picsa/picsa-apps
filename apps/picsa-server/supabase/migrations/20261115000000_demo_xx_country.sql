-- ============================================================================
-- Demo (`xx`) country: infrastructure for the resettable prod/dev sandbox
-- ============================================================================
-- STRUCTURE ONLY. All repeatable demo content lives in
-- `supabase/data/demo/demo_baseline.sql` and is applied on demand via
-- `yarn nx run picsa-server:demo:reset` — never add demo rows here.
--
-- IDEMPOTENT: safe to re-apply (IF NOT EXISTS / ON CONFLICT / DROP+CREATE).
--
-- ----------------------------------------------------------------------------
-- Adding a country (checklist — no policy edits required):
--   1. `ALTER TYPE public.country_code ADD VALUE '<cc>';`
--   2. `INSERT INTO storage.buckets (id, name, public) VALUES ('<cc>', '<cc>', true) ...`
--      plus one `Storage <cc> public SELECT` policy (3 lines, see §3 below).
--   3. `geo.countries` row + `geo.locales` row(s).
-- Write access follows automatically: the `Storage country authenticated *`
-- policies (§4) grant writes to any non-`global` bucket where the caller holds
-- a matching country role (`user_has_country_role` joins deployments, so a
-- bucket with no deployment country grants nobody anything). `global` stays
-- read-only by explicit exclusion — `user_has_country_role('global', ...)`
-- matches every deployment, so it must never be covered by a write policy.
-- ----------------------------------------------------------------------------

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. `xx` country_code enum value (mirrors 20260607151600_add_zw_country_code.sql)
-- ----------------------------------------------------------------------------
ALTER TYPE public.country_code ADD VALUE IF NOT EXISTS 'xx';

-- ----------------------------------------------------------------------------
-- 2. `xx` storage bucket (public read, matching mw/zm/zw baseline)
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('xx', 'xx', true)
ON CONFLICT (id) DO UPDATE SET name = excluded.name, public = excluded.public;

-- ----------------------------------------------------------------------------
-- 3. Public read for the `xx` bucket (per-bucket SELECT is the convention;
--    see legacy/20240215194323_country_storage_buckets.sql and
--    20261012000000_zw_storage_bucket.sql)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Storage xx public SELECT" ON storage.objects;
CREATE POLICY "Storage xx public SELECT" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'xx');

-- ----------------------------------------------------------------------------
-- 4. Generic country write policies (replaces the hardcoded
--    `bucket_id IN ('mw', 'zm', 'zw')` lists from
--    20261113000000_resources_rls_and_storage_hardening.sql)
-- ----------------------------------------------------------------------------
-- The old lists had to be dropped and recreated verbatim for every new
-- country. The generic form below is equivalent for all existing buckets:
--  - `global` writes were never allowed (policies dropped by hardening) and
--    stay excluded here;
--  - `feedback` writes were never allowed (not in the old lists) and stay
--    denied: no deployment has `country_code = 'feedback'`, so the role
--    check can never pass for it (service_role bypasses RLS regardless);
--  - `mw`/`zm`/`zw` behave exactly as before (role check unchanged).
DROP POLICY IF EXISTS "Storage country authenticated INSERT" ON storage.objects;
CREATE POLICY "Storage country authenticated INSERT" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id <> 'global'
  AND (
    public.user_has_country_role(bucket_id, 'resources.editor')
    OR public.user_has_country_role(bucket_id, 'climate.editor')
  )
);

DROP POLICY IF EXISTS "Storage country authenticated UPDATE" ON storage.objects;
CREATE POLICY "Storage country authenticated UPDATE" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id <> 'global'
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
  bucket_id <> 'global'
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
  bucket_id <> 'global'
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

-- ----------------------------------------------------------------------------
-- 5. Geo: `XX` is the demo country (was `Test`), with an English locale and a
--    Chichewa (`ny`) locale backing the `translations.xx_ny` column below
-- ----------------------------------------------------------------------------
UPDATE geo.countries SET name = 'Demo' WHERE code = 'XX';

INSERT INTO geo.locales (language_code, name, local_name, country_code)
VALUES ('en', 'XX', 'English', 'English')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, local_name = EXCLUDED.local_name;

INSERT INTO geo.locales (language_code, name, local_name, country_code)
VALUES ('ny', 'Chichewa', 'Chichewa', 'XX')
ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, local_name = EXCLUDED.local_name;

-- Demo translations column: gives the demo a real editable locale
-- (`xx_ny`) so the dashboard translations page has a demo column to show
-- instead of falling back to `global_en` (which matches no column — empty
-- table, phantom pending counts). The `ny`/XX locale row above feeds the
-- `gen-types` legacy `xx_ny` locale code.
ALTER TABLE public.translations ADD COLUMN IF NOT EXISTS xx_ny text;

-- ----------------------------------------------------------------------------
-- 6. Retire the broken `test` (tj) deployment — replaced by `demo` (`xx`)
--    (user_roles cascade via public_user_roles_deployment_id_fkey).
--    Local CSV seeds still list `test` until the next `db:seed:export` refresh
--    from prod — that refresh drops it automatically once this runs on prod.
-- ----------------------------------------------------------------------------
DELETE FROM public.deployments WHERE id = 'test';

COMMIT;
