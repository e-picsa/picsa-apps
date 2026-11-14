BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path TO public, extensions;

-- NOTE on scope: this file asserts DURABLE infra (enum, bucket, generic
-- write-rule helper, demo translations column). Seed-owned rows (geo names,
-- en/ny locale rows, absence of the retired `test` deployment) live in the CSV
-- seed pipeline and are undone by every `db:seed` — they converge when
-- `db:seed:export` runs against prod after the migration lands there, so
-- asserting them here would fail on any seeded database by design.
SELECT plan(7);

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

-- Single shared write rule exists with the expected signature
SELECT has_function('public', 'storage_country_can_write', ARRAY['text', 'uuid', 'boolean']);

-- All 3 country write policies delegate to the helper (grep-able, identical rule)
SELECT is(
  (SELECT count(*)::int FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname LIKE 'Storage country authenticated%'
      AND (coalesce(qual, '') || ' ' || coalesce(with_check, '')) LIKE '%storage_country_can_write%'),
  3,
  'all 3 storage country write policies use the shared helper'
);

-- No hardcoded country lists remain (adding a country must never require policy rewrites)
SELECT is(
  (SELECT count(*)::int FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname LIKE 'Storage country authenticated%'
      AND (coalesce(qual, '') || ' ' || coalesce(with_check, '')) LIKE '%mw%'),
  0,
  'storage country write policies contain no hardcoded country list'
);

-- The helper itself excludes the read-only `global` bucket
-- (`user_has_country_role('global', …)` matches every deployment, so without
-- the exclusion any country editor could write to shared global assets)
SELECT ok(
  (SELECT strpos(prosrc, 'global') > 0 FROM pg_proc WHERE proname = 'storage_country_can_write'),
  'write helper excludes the global bucket'
);

-- Demo translations column exists (DDL-owned, unlike seed-owned locale rows)
SELECT ok(
  (SELECT count(*)::int FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'translations' AND column_name = 'xx_ny') = 1,
  'translations has xx_ny column'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
