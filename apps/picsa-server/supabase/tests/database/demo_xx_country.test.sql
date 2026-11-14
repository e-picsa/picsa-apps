BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path TO public, extensions;

-- NOTE on scope: this file asserts the DURABLE infrastructure from migration
-- 20261115000000 (enum value, bucket, generic write policies). Row-level
-- demo/geo content (geo.countries name, geo.locales en-XX, absence of the
-- retired `test` deployment) is owned by the CSV seed pipeline (`db:seed`
-- wipes + reimports, `db:seed:extended` upserts remote rows), so it is
-- intentionally NOT asserted here — it converges the next time
-- `db:seed:export` runs against prod after the migration has been applied
-- there. Asserting it here would fail on any seeded database by design.
SELECT plan(5);

-- `xx` enum value exists for country_code columns
SELECT is(
  (SELECT count(*)::int FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'country_code' AND e.enumlabel = 'xx'),
  1,
  'country_code enum includes xx'
);

-- `xx` storage bucket exists and is public (readable)
SELECT is(
  (SELECT public FROM storage.buckets WHERE id = 'xx'),
  true,
  'xx storage bucket exists and is public'
);

-- No hardcoded country lists remain in storage write policies (regression
-- guard: adding a country must never require policy rewrites again)
SELECT is(
  (SELECT count(*)::int FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname LIKE 'Storage country authenticated%'
      AND (coalesce(qual, '') || ' ' || coalesce(with_check, '')) LIKE '%mw%'),
  0,
  'storage country write policies contain no hardcoded country list'
);

-- Write policies still exclude the read-only `global` bucket explicitly
-- (required: `user_has_country_role('global', …)` matches every deployment)
SELECT is(
  (SELECT count(*)::int FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname LIKE 'Storage country authenticated%'
      AND (coalesce(qual, '') || ' ' || coalesce(with_check, '')) LIKE '%<> ''global''%'),
  3,
  'all 3 storage country write policies exclude global bucket'
);

-- Demo translations column exists (DDL-owned, unlike seed-owned locale rows)
SELECT ok(
  EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'translations' AND column_name = 'xx_ny'
  ),
  'translations has xx_ny column'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
