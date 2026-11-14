BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path TO public, extensions;

-- NOTE on scope: this file asserts DURABLE infra (enum, bucket, generic
-- write-rule helper, demo translations column). Seed-owned rows (geo names,
-- en/ny locale rows, absence of the retired `test` deployment) live in the CSV
-- seed pipeline and are undone by every `db:seed` — they converge when
-- `db:seed:export` runs against prod after the migration lands there, so
-- asserting them here would fail on any seeded database by design.
SELECT plan(13);

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

-- ----------------------------------------------------------------------------
-- INSERT ownership (tightened vs the old policies, which checked roles only):
-- inserts require auth.uid() = owner for editors and admins alike.
-- Fixtures live entirely in this transaction (rolled back at the end).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp.set_demo_actor(p_pg_role text, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    PERFORM set_config('request.jwt.claims', json_build_object('role', p_pg_role)::text, true);
  ELSE
    PERFORM set_config(
      'request.jwt.claims',
      json_build_object('sub', p_user_id::text, 'role', p_pg_role)::text,
      true
    );
  END IF;
  EXECUTE format('SET LOCAL ROLE %I', p_pg_role);
END;
$$;

DO $$
DECLARE
  v_editor uuid := 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
  v_admin uuid := 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';
  v_other uuid := 'cccccccc-3333-4333-8333-cccccccccccc';
BEGIN
  INSERT INTO auth.users (id, instance_id, role, aud, email, raw_app_meta_data, raw_user_meta_data)
  VALUES
    (v_editor, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'demo_ed@picsa.test', '{}', '{"country_code":"xx"}'),
    (v_admin,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'demo_ad@picsa.test', '{}', '{"country_code":"xx"}'),
    (v_other,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'demo_no@picsa.test', '{}', '{"country_code":"xx"}')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.deployments (id, country_code, label, public)
  VALUES ('t_xx', 'xx', 'Test XX', true)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, deployment_id, roles)
  VALUES
    (v_editor, 't_xx', ARRAY['resources.editor']::public.app_role[]),
    (v_admin, 't_xx', ARRAY['resources.admin']::public.app_role[])
  ON CONFLICT (deployment_id, user_id) DO UPDATE SET roles = EXCLUDED.roles;
END $$;

-- resources.editor inserts own object: allowed (unchanged behavior)
SELECT pg_temp.set_demo_actor('authenticated', 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa');
SELECT lives_ok(
  $$ INSERT INTO storage.objects (bucket_id, name, owner)
     VALUES ('xx', 'demo/own_ed.pdf', 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa') $$,
  'xx resources.editor can INSERT own object'
);

-- resources.editor inserts with null owner: rejected (tightened — old policy allowed it)
SELECT throws_ok(
  $$ INSERT INTO storage.objects (bucket_id, name, owner)
     VALUES ('xx', 'demo/null_ed.pdf', NULL) $$,
  '42501',
  NULL,
  'xx resources.editor cannot INSERT with null owner'
);

-- resources.editor inserts another user's object: rejected (tightened)
SELECT throws_ok(
  $$ INSERT INTO storage.objects (bucket_id, name, owner)
     VALUES ('xx', 'demo/spoof_ed.pdf', 'cccccccc-3333-4333-8333-cccccccccccc') $$,
  '42501',
  NULL,
  'xx resources.editor cannot INSERT another user object'
);

-- resources.admin (no editor role needed beyond escalation) inserts own object: allowed
SELECT pg_temp.set_demo_actor('authenticated', 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb');
SELECT lives_ok(
  $$ INSERT INTO storage.objects (bucket_id, name, owner)
     VALUES ('xx', 'demo/own_ad.pdf', 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb') $$,
  'xx resources.admin can INSERT own object'
);

-- resources.admin inserts another user's object: rejected (tightened — old policy allowed it)
SELECT throws_ok(
  $$ INSERT INTO storage.objects (bucket_id, name, owner)
     VALUES ('xx', 'demo/spoof_ad.pdf', 'cccccccc-3333-4333-8333-cccccccccccc') $$,
  '42501',
  NULL,
  'xx resources.admin cannot INSERT another user object'
);

-- UPDATE path still works for owners (helper USING branch)
SELECT pg_temp.set_demo_actor('authenticated', 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa');
SELECT lives_ok(
  $$ UPDATE storage.objects SET metadata = '{"ok":true}'::jsonb
     WHERE bucket_id = 'xx' AND name = 'demo/own_ed.pdf' $$,
  'xx resources.editor can UPDATE own object'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
