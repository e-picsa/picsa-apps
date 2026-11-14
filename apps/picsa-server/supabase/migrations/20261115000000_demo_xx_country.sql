-- ============================================================================
-- Demo (`xx`) country: infrastructure for the resettable prod/dev sandbox
-- ============================================================================
-- STRUCTURE ONLY. All repeatable demo content lives in
-- `supabase/data/demo/demo-baseline.ts` (typed TS) and is applied on demand
-- via `yarn nx run picsa-server:demo:reset` — never add demo rows here.
--
-- IDEMPOTENT: safe to re-apply (IF NOT EXISTS / ON CONFLICT / DROP+CREATE).
--
-- ----------------------------------------------------------------------------
-- Adding a country (checklist — no per-country RLS edits required):
--   1. `ALTER TYPE public.country_code ADD VALUE '<cc>';`
--   2. `INSERT INTO storage.buckets (id, name, public) VALUES ('<cc>', '<cc>', true) ...`
--      plus one `Storage <cc> public SELECT` policy (3 lines, see §3 below).
--   3. `geo.countries` row (+ `geo.locales` row(s) as needed).
-- Write access follows automatically: the `Storage country authenticated *`
-- policies below delegate to `storage_country_can_write()`, which grants
-- writes on any non-`global` bucket where the caller holds a matching country
-- role (`user_has_country_role` joins deployments, so a bucket with no
-- deployment country grants nobody anything). `global` stays read-only by
-- explicit exclusion — `user_has_country_role('global', …)` matches every
-- deployment, so without it any country editor could write to shared assets.
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
-- 4. Generic country write rules (replaces the hardcoded
--    `bucket_id IN ('mw', 'zm', 'zw')` lists from
--    20261113000000_resources_rls_and_storage_hardening.sql)
-- ----------------------------------------------------------------------------
-- One helper holds the whole rule so the three policies stay identical and
-- grep-able; no per-country edits ever again. Semantics match the old
-- policies exactly (including: inserts require ownership).
CREATE OR REPLACE FUNCTION public.storage_country_can_write(p_bucket text, p_owner uuid, p_is_insert boolean DEFAULT false)
RETURNS boolean
LANGUAGE sql STABLE
SET search_path = public, auth
AS $$
  SELECT p_bucket <> 'global' AND (
    -- admins may write anything (inserts still require ownership, as before)
    (
      (
        public.user_has_country_role(p_bucket, 'resources.admin')
        OR public.user_has_country_role(p_bucket, 'climate.admin')
      )
      AND (NOT p_is_insert OR auth.uid() = p_owner)
    )
    -- editors (and escalated admins) may insert as themselves, or modify own objects
    OR (
      auth.uid() = p_owner
      AND (
        public.user_has_country_role(p_bucket, 'resources.editor')
        OR public.user_has_country_role(p_bucket, 'climate.editor')
      )
    )
  )
$$;

-- Explicit grant (policies evaluate as the authenticated caller, and future
-- edge functions call with service_role; anon intentionally excluded).
REVOKE ALL ON FUNCTION public.storage_country_can_write(text, uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.storage_country_can_write(text, uuid, boolean) TO authenticated, service_role;

-- WITH CHECK omitted on UPDATE: Postgres reuses USING, which is identical here.
DROP POLICY IF EXISTS "Storage country authenticated INSERT" ON storage.objects;
CREATE POLICY "Storage country authenticated INSERT" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (public.storage_country_can_write(bucket_id, owner, true));

DROP POLICY IF EXISTS "Storage country authenticated UPDATE" ON storage.objects;
CREATE POLICY "Storage country authenticated UPDATE" ON storage.objects
FOR UPDATE TO authenticated
USING (public.storage_country_can_write(bucket_id, owner));

DROP POLICY IF EXISTS "Storage country authenticated DELETE" ON storage.objects;
CREATE POLICY "Storage country authenticated DELETE" ON storage.objects
FOR DELETE TO authenticated
USING (public.storage_country_can_write(bucket_id, owner));

-- ----------------------------------------------------------------------------
-- 5. Geo: `XX` is the demo country (was `Test`), with English and
--    Chichewa (`ny`) locales. The `ny` row backs the `translations.xx_ny`
--    column below.
-- ----------------------------------------------------------------------------
INSERT INTO geo.countries (code, name)
VALUES ('XX', 'Demo')
ON CONFLICT (code) DO UPDATE SET name = excluded.name;

INSERT INTO geo.locales (language_code, name, local_name, country_code)
VALUES
  ('en', 'English', 'English', 'XX'),
  ('ny', 'Chichewa', 'Chichewa', 'XX')
ON CONFLICT (code) DO UPDATE SET name = excluded.name, local_name = excluded.local_name;

-- Demo translations column: gives the demo a real editable locale instead of
-- falling back to `global_en` (which matches no column — empty table, phantom
-- pending counts). Covered by pgTAP (`demo_xx_country.test.sql`).
ALTER TABLE public.translations ADD COLUMN IF NOT EXISTS xx_ny text;

-- ----------------------------------------------------------------------------
-- 6. Retire the broken `test` deployment (id `test`, country_code `tj`) —
--    replaced by `demo` (`xx`)
-- ----------------------------------------------------------------------------
-- `user_roles` and `deployment_access_requests` cascade automatically.
-- `budget.budgets` has NO ON DELETE action, so test-scoped shared budgets are
-- deleted explicitly first (test data by definition — never prod content).
DELETE FROM budget.budgets WHERE deployment_id = 'test';
DELETE FROM public.deployments WHERE id = 'test';

COMMIT;
