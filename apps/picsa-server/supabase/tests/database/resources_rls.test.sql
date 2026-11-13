BEGIN;

CREATE EXTENSION IF NOT EXISTS pgtap WITH SCHEMA extensions;
SET search_path TO public, extensions;

SELECT plan(50);

-- ----------------------------------------------------------------------------
-- Test Helpers & Fixtures (rolled back cleanly at end of transaction)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pg_temp.set_actor(p_pg_role text, p_user_id uuid)
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

-- Allow direct DELETE on storage.objects within this rolled-back test transaction
-- (normally guarded by storage.protect_delete() outside Storage API)
SELECT set_config('storage.allow_delete_query', 'true', true);

-- Ensure test deployments & buckets exist even on an unseeded DB reset
INSERT INTO public.deployments (id, country_code, label)
VALUES
  ('mw', 'mw', 'Malawi App'),
  ('zm', 'zm', 'Zambia App'),
  ('zw', 'zw', 'Zimbabwe App')
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES
  ('global', 'global', true),
  ('mw', 'mw', true),
  ('zm', 'zm', true),
  ('zw', 'zw', true)
ON CONFLICT (id) DO NOTHING;

-- Deterministic test user IDs
DO $$
DECLARE
  v_mw_editor_1 uuid := '11111111-1111-4111-8111-111111111111';
  v_mw_editor_2 uuid := '22222222-2222-4222-8222-222222222222';
  v_mw_admin    uuid := '33333333-3333-4333-8333-333333333333';
  v_mw_climate  uuid := '44444444-4444-4444-8444-444444444444';
  v_zm_editor   uuid := '55555555-5555-4555-8555-555555555555';
  v_global_adm  uuid := '66666666-6666-4666-8666-666666666666';
  v_no_role     uuid := '77777777-7777-4777-8777-777777777777';
BEGIN
  INSERT INTO auth.users (id, instance_id, role, aud, email, raw_app_meta_data, raw_user_meta_data)
  VALUES
    (v_mw_editor_1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test_mw_ed1@picsa.test', '{}', '{"country_code":"mw"}'),
    (v_mw_editor_2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test_mw_ed2@picsa.test', '{}', '{"country_code":"mw"}'),
    (v_mw_admin,    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test_mw_adm@picsa.test', '{}', '{"country_code":"mw"}'),
    (v_mw_climate,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test_mw_cli@picsa.test', '{}', '{"country_code":"mw"}'),
    (v_zm_editor,   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test_zm_ed1@picsa.test', '{}', '{"country_code":"zm"}'),
    (v_global_adm,  '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test_glob_a@picsa.test', '{}', '{"country_code":"global"}'),
    (v_no_role,     '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test_norole@picsa.test', '{}', '{"country_code":"mw"}')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, deployment_id, roles)
  VALUES
    (v_mw_editor_1, 'mw', ARRAY['resources.editor']::public.app_role[]),
    (v_mw_editor_2, 'mw', ARRAY['resources.editor']::public.app_role[]),
    (v_mw_admin,    'mw', ARRAY['resources.admin']::public.app_role[]),
    (v_mw_climate,  'mw', ARRAY['climate.editor']::public.app_role[]),
    (v_zm_editor,   'zm', ARRAY['resources.editor']::public.app_role[]),
    (v_global_adm,  'mw', ARRAY['admin']::public.app_role[])
  ON CONFLICT (deployment_id, user_id) DO UPDATE SET roles = EXCLUDED.roles;

  -- Seed resource rows owned by mw_editor_1 and zm_editor
  INSERT INTO public.resource_collections (id, title, country_code, owner)
  VALUES
    ('test_col_mw_ed1', 'MW Ed1 Collection', 'mw', v_mw_editor_1),
    ('test_col_mw_adm_del', 'MW Ed1 Delete By Admin', 'mw', v_mw_editor_1),
    ('test_col_zm_ed', 'ZM Ed Collection', 'zm', v_zm_editor);

  INSERT INTO public.resource_files (id, title, country_code, owner)
  VALUES
    ('test_file_mw_ed1', 'MW Ed1 File', 'mw', v_mw_editor_1),
    ('test_file_mw_adm_del', 'MW Ed1 File Admin Del', 'mw', v_mw_editor_1);

  INSERT INTO public.resource_links (id, title, type, url, country_code, owner)
  VALUES
    ('test_link_mw_ed1', 'MW Ed1 Link', 'web', 'https://example.org/mw', 'mw', v_mw_editor_1);

  -- Seed storage objects
  INSERT INTO storage.objects (id, bucket_id, name, owner, owner_id)
  VALUES
    ('88888888-8888-4888-8888-888888888881', 'mw', 'resources/test_ed1.pdf', v_mw_editor_1, v_mw_editor_1::text),
    ('88888888-8888-4888-8888-888888888882', 'mw', 'resources/test_ed2.pdf', v_mw_editor_2, v_mw_editor_2::text),
    ('88888888-8888-4888-8888-888888888883', 'global', 'resources/covers/test_global.svg', v_global_adm, v_global_adm::text);
END $$;

-- ----------------------------------------------------------------------------
-- 1. Policy Hygiene & Schema Constraints
-- ----------------------------------------------------------------------------
SELECT is(
  (SELECT count(*)::int FROM pg_policies
   WHERE schemaname = 'storage' AND tablename = 'objects'
     AND policyname ~ '^Storage (resources|global|mw|zm|zw) public (INSERT|UPDATE|DELETE|SELECT)$'
     AND policyname !~ 'public SELECT$'
  ),
  0,
  'Legacy public write policies removed from storage.objects'
);

SELECT is(
  (SELECT count(*)::int FROM pg_policies
   WHERE schemaname = 'storage' AND tablename = 'objects'
     AND policyname LIKE 'Storage resources %'
  ),
  0,
  'Unused resources bucket policies removed from storage.objects'
);

SELECT throws_ok(
  $$ INSERT INTO public.resource_collections (id, title, country_code, owner)
     VALUES ('bad_glob_col', 'Global', 'global', '11111111-1111-4111-8111-111111111111') $$,
  '23514',
  NULL,
  'CHECK constraint blocks global country_code in resource_collections'
);

SELECT throws_ok(
  $$ INSERT INTO public.resource_collections (id, title, country_code, owner)
     VALUES ('bad_null_col', 'Null', NULL, '11111111-1111-4111-8111-111111111111') $$,
  '23502',
  NULL,
  'NOT NULL blocks null country_code in resource_collections'
);

SELECT throws_ok(
  $$ INSERT INTO public.resource_files (id, title, country_code, owner)
     VALUES ('bad_glob_file', 'Global', 'global', '11111111-1111-4111-8111-111111111111') $$,
  '23514',
  NULL,
  'CHECK constraint blocks global country_code in resource_files'
);

SELECT throws_ok(
  $$ INSERT INTO public.resource_links (id, title, type, url, country_code, owner)
     VALUES ('bad_glob_link', 'Global', 'web', 'https://example.org', 'global', '11111111-1111-4111-8111-111111111111') $$,
  '23514',
  NULL,
  'CHECK constraint blocks global country_code in resource_links'
);

-- ----------------------------------------------------------------------------
-- 2. Auth Helper Functions (`user_is_global_admin`, `user_has_country_role`)
-- ----------------------------------------------------------------------------
SELECT pg_temp.set_actor('authenticated', '66666666-6666-4666-8666-666666666666');
SELECT ok(public.user_is_global_admin(), 'global admin user_is_global_admin() = true');
SELECT ok(public.user_has_country_role(NULL, 'translations.editor'), 'global admin satisfies NULL-country translations check');

SELECT pg_temp.set_actor('authenticated', '33333333-3333-4333-8333-333333333333');
SELECT ok(NOT public.user_is_global_admin(), 'country-only resources.admin user_is_global_admin() = false');

SELECT pg_temp.set_actor('authenticated', '77777777-7777-4777-8777-777777777777');
SELECT ok(NOT public.user_is_global_admin(), 'no-role user user_is_global_admin() = false');

-- ----------------------------------------------------------------------------
-- 3. Anonymous (`anon`) & Unprivileged Authenticated (`no_role`) Access
-- ----------------------------------------------------------------------------
SELECT pg_temp.set_actor('anon', NULL);
SELECT ok(EXISTS (SELECT 1 FROM public.resource_collections WHERE id = 'test_col_mw_ed1'), 'anon can SELECT resource_collections');
SELECT throws_ok(
  $$ INSERT INTO public.resource_collections (id, title, country_code, owner)
     VALUES ('anon_col', 'Anon', 'mw', '11111111-1111-4111-8111-111111111111') $$,
  '42501',
  NULL,
  'anon cannot INSERT resource_collections'
);
SELECT throws_ok(
  $$ INSERT INTO storage.objects (bucket_id, name) VALUES ('mw', 'resources/anon.pdf') $$,
  '42501',
  NULL,
  'anon cannot INSERT storage.objects in mw'
);

SELECT pg_temp.set_actor('authenticated', '77777777-7777-4777-8777-777777777777');
SELECT ok(EXISTS (SELECT 1 FROM public.resource_files WHERE id = 'test_file_mw_ed1'), 'no-role authenticated user can SELECT resource_files');
SELECT throws_ok(
  $$ INSERT INTO public.resource_collections (id, title, country_code, owner)
     VALUES ('norole_col', 'NoRole', 'mw', '77777777-7777-4777-8777-777777777777') $$,
  '42501',
  NULL,
  'no-role authenticated user cannot INSERT resource_collections'
);
SELECT throws_ok(
  $$ INSERT INTO public.resource_files (id, title, country_code, owner)
     VALUES ('norole_file', 'NoRole', 'mw', '77777777-7777-4777-8777-777777777777') $$,
  '42501',
  NULL,
  'no-role authenticated user cannot INSERT resource_files'
);
SELECT throws_ok(
  $$ INSERT INTO storage.objects (bucket_id, name, owner)
     VALUES ('mw', 'resources/norole.pdf', '77777777-7777-4777-8777-777777777777') $$,
  '42501',
  NULL,
  'no-role authenticated user cannot INSERT storage.objects in mw'
);
SELECT throws_ok(
  $$ INSERT INTO storage.objects (bucket_id, name, owner)
     VALUES ('global', 'resources/covers/norole.svg', '77777777-7777-4777-8777-777777777777') $$,
  '42501',
  NULL,
  'no-role authenticated user cannot INSERT storage.objects in global'
);

-- ----------------------------------------------------------------------------
-- 4. Collaborative Collection Editing vs Ownership on DELETE & Field Guards
-- ----------------------------------------------------------------------------
SELECT pg_temp.set_actor('authenticated', '11111111-1111-4111-8111-111111111111');
SELECT lives_ok(
  $$ INSERT INTO public.resource_collections (id, title, country_code, owner)
     VALUES ('test_col_created_by_ed1', 'Created By Ed1', 'mw', '11111111-1111-4111-8111-111111111111') $$,
  'mw_editor_1 can INSERT mw collection with self as owner'
);
SELECT throws_ok(
  $$ INSERT INTO public.resource_collections (id, title, country_code, owner)
     VALUES ('test_col_spoof', 'Spoof Owner', 'mw', '22222222-2222-4222-8222-222222222222') $$,
  '42501',
  NULL,
  'mw_editor_1 cannot INSERT collection spoofing another owner'
);

-- Different editor in same country (mw_editor_2) updates mw_editor_1 collection
SELECT pg_temp.set_actor('authenticated', '22222222-2222-4222-8222-222222222222');
SELECT lives_ok(
  $$ UPDATE public.resource_collections
     SET title = 'Updated By Ed2',
         description = 'Collaborative edit',
         resource_files = ARRAY['test_file_mw_ed1']
     WHERE id = 'test_col_mw_ed1' $$,
  'mw_editor_2 can UPDATE mw_editor_1 collection title/description/files'
);
SELECT is(
  (SELECT title FROM public.resource_collections WHERE id = 'test_col_mw_ed1'),
  'Updated By Ed2',
  'mw_editor_2 collaborative UPDATE persisted'
);
SELECT throws_ok(
  $$ UPDATE public.resource_collections
     SET owner = '22222222-2222-4222-8222-222222222222'
     WHERE id = 'test_col_mw_ed1' $$,
  'P0001',
  'Only resources.admin can change collection owner',
  'non-admin editor cannot hijack collection owner via UPDATE'
);
SELECT throws_ok(
  $$ UPDATE public.resource_collections
     SET country_code = 'zm'
     WHERE id = 'test_col_mw_ed1' $$,
  'P0001',
  'Only resources.admin can change collection country_code',
  'non-admin editor cannot move mw collection to zm'
);

WITH del AS (
  DELETE FROM public.resource_collections WHERE id = 'test_col_mw_ed1' RETURNING id
)
SELECT is((SELECT count(*)::int FROM del), 0, 'non-owner mw_editor_2 cannot DELETE mw_editor_1 collection');

-- Owner (mw_editor_1) CAN delete own collection
SELECT pg_temp.set_actor('authenticated', '11111111-1111-4111-8111-111111111111');
WITH del AS (
  DELETE FROM public.resource_collections WHERE id = 'test_col_created_by_ed1' RETURNING id
)
SELECT is((SELECT count(*)::int FROM del), 1, 'owner mw_editor_1 can DELETE own collection');

-- Country resources.admin (mw_admin) CAN delete mw_editor_1 collection, CANNOT move to zm
SELECT pg_temp.set_actor('authenticated', '33333333-3333-4333-8333-333333333333');
SELECT throws_ok(
  $$ UPDATE public.resource_collections
     SET country_code = 'zm'
     WHERE id = 'test_col_mw_adm_del' $$,
  '42501',
  NULL,
  'mw resources.admin cannot move mw collection to zm (RLS WITH CHECK)'
);
WITH del AS (
  DELETE FROM public.resource_collections WHERE id = 'test_col_mw_adm_del' RETURNING id
)
SELECT is((SELECT count(*)::int FROM del), 1, 'mw resources.admin can DELETE mw_editor_1 collection');

-- ----------------------------------------------------------------------------
-- 5. Owner-Scoped UPDATE / DELETE on resource_files & resource_links
-- ----------------------------------------------------------------------------
SELECT pg_temp.set_actor('authenticated', '22222222-2222-4222-8222-222222222222');
WITH upd AS (
  UPDATE public.resource_files SET title = 'Hijacked File' WHERE id = 'test_file_mw_ed1' RETURNING id
)
SELECT is((SELECT count(*)::int FROM upd), 0, 'mw_editor_2 cannot UPDATE mw_editor_1 resource_files row');

WITH del AS (
  DELETE FROM public.resource_files WHERE id = 'test_file_mw_ed1' RETURNING id
)
SELECT is((SELECT count(*)::int FROM del), 0, 'mw_editor_2 cannot DELETE mw_editor_1 resource_files row');

WITH upd AS (
  UPDATE public.resource_links SET title = 'Hijacked Link' WHERE id = 'test_link_mw_ed1' RETURNING id
)
SELECT is((SELECT count(*)::int FROM upd), 0, 'mw_editor_2 cannot UPDATE mw_editor_1 resource_links row');

SELECT pg_temp.set_actor('authenticated', '11111111-1111-4111-8111-111111111111');
WITH upd AS (
  UPDATE public.resource_files SET title = 'Updated Own File' WHERE id = 'test_file_mw_ed1' RETURNING id
)
SELECT is((SELECT count(*)::int FROM upd), 1, 'owner mw_editor_1 can UPDATE own resource_files row');

SELECT throws_ok(
  $$ UPDATE public.resource_files SET country_code = 'zm' WHERE id = 'test_file_mw_ed1' $$,
  '42501',
  NULL,
  'owner mw_editor_1 cannot move own resource_files row to zm'
);

SELECT pg_temp.set_actor('authenticated', '33333333-3333-4333-8333-333333333333');
WITH del AS (
  DELETE FROM public.resource_files WHERE id = 'test_file_mw_adm_del' RETURNING id
)
SELECT is((SELECT count(*)::int FROM del), 1, 'mw resources.admin can DELETE mw_editor_1 resource_files row');

-- ----------------------------------------------------------------------------
-- 6. Cross-Country Isolation & Role Separation
-- ----------------------------------------------------------------------------
SELECT pg_temp.set_actor('authenticated', '55555555-5555-4555-8555-555555555555');
SELECT throws_ok(
  $$ INSERT INTO public.resource_collections (id, title, country_code, owner)
     VALUES ('zm_cross_mw', 'Cross', 'mw', '55555555-5555-4555-8555-555555555555') $$,
  '42501',
  NULL,
  'zm resources.editor cannot INSERT mw collection'
);
WITH upd AS (
  UPDATE public.resource_collections SET title = 'ZM Attack' WHERE id = 'test_col_mw_ed1' RETURNING id
)
SELECT is((SELECT count(*)::int FROM upd), 0, 'zm resources.editor cannot UPDATE mw collection');

SELECT lives_ok(
  $$ INSERT INTO public.resource_files (id, title, country_code, owner)
     VALUES ('zm_valid_file', 'ZM File', 'zm', '55555555-5555-4555-8555-555555555555') $$,
  'zm resources.editor can INSERT zm resource_files row'
);

SELECT pg_temp.set_actor('authenticated', '44444444-4444-4444-8444-444444444444');
SELECT throws_ok(
  $$ INSERT INTO public.resource_collections (id, title, country_code, owner)
     VALUES ('cli_mw_col', 'Climate Col', 'mw', '44444444-4444-4444-8444-444444444444') $$,
  '42501',
  NULL,
  'mw climate.editor cannot INSERT resource_collections'
);

-- ----------------------------------------------------------------------------
-- 7. `storage.objects` Role & Bucket Policies
-- ----------------------------------------------------------------------------
-- mw_editor_1: can upload to mw, update/delete own mw object, cannot update/delete ed2's object, cannot write zm/global
SELECT pg_temp.set_actor('authenticated', '11111111-1111-4111-8111-111111111111');
SELECT lives_ok(
  $$ INSERT INTO storage.objects (bucket_id, name, owner, owner_id)
     VALUES ('mw', 'resources/ed1_upload.pdf', '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111') $$,
  'mw resources.editor can INSERT into mw bucket'
);
WITH upd AS (
  UPDATE storage.objects SET metadata = '{"ok":true}'::jsonb WHERE id = '88888888-8888-4888-8888-888888888881' RETURNING id
)
SELECT is((SELECT count(*)::int FROM upd), 1, 'mw resources.editor can UPDATE own storage object');

WITH upd AS (
  UPDATE storage.objects SET metadata = '{"hijack":true}'::jsonb WHERE id = '88888888-8888-4888-8888-888888888882' RETURNING id
)
SELECT is((SELECT count(*)::int FROM upd), 0, 'mw resources.editor cannot UPDATE another editor storage object');

WITH del AS (
  DELETE FROM storage.objects WHERE id = '88888888-8888-4888-8888-888888888882' RETURNING id
)
SELECT is((SELECT count(*)::int FROM del), 0, 'mw resources.editor cannot DELETE another editor storage object');

WITH del AS (
  DELETE FROM storage.objects WHERE id = '88888888-8888-4888-8888-888888888881' RETURNING id
)
SELECT is((SELECT count(*)::int FROM del), 1, 'mw resources.editor can DELETE own storage object');

SELECT throws_ok(
  $$ INSERT INTO storage.objects (bucket_id, name, owner)
     VALUES ('zm', 'resources/mw_attack.pdf', '11111111-1111-4111-8111-111111111111') $$,
  '42501',
  NULL,
  'mw resources.editor cannot INSERT into zm bucket'
);
SELECT throws_ok(
  $$ INSERT INTO storage.objects (bucket_id, name, owner)
     VALUES ('global', 'resources/covers/mw_attack.svg', '11111111-1111-4111-8111-111111111111') $$,
  '42501',
  NULL,
  'mw resources.editor cannot INSERT into global bucket'
);

-- mw climate.editor: can upload forecast files into mw bucket
SELECT pg_temp.set_actor('authenticated', '44444444-4444-4444-8444-444444444444');
SELECT lives_ok(
  $$ INSERT INTO storage.objects (bucket_id, name, owner, owner_id)
     VALUES ('mw', 'forecasts/2026/seasonal/mw_en.pdf', '44444444-4444-4444-8444-444444444444', '44444444-4444-4444-8444-444444444444') $$,
  'mw climate.editor can INSERT forecast object into mw bucket'
);

-- mw_admin: can delete ed2's object in mw, cannot write global bucket
SELECT pg_temp.set_actor('authenticated', '33333333-3333-4333-8333-333333333333');
WITH del AS (
  DELETE FROM storage.objects WHERE id = '88888888-8888-4888-8888-888888888882' RETURNING id
)
SELECT is((SELECT count(*)::int FROM del), 1, 'mw resources.admin can DELETE any mw storage object');

SELECT throws_ok(
  $$ INSERT INTO storage.objects (bucket_id, name, owner)
     VALUES ('global', 'resources/covers/adm_attack.svg', '33333333-3333-4333-8333-333333333333') $$,
  '42501',
  NULL,
  'country-only resources.admin cannot INSERT into global bucket'
);

-- global_admin: can write & delete in global bucket
SELECT pg_temp.set_actor('authenticated', '66666666-6666-4666-8666-666666666666');
SELECT lives_ok(
  $$ INSERT INTO storage.objects (bucket_id, name, owner, owner_id)
     VALUES ('global', 'resources/covers/global_new.svg', '66666666-6666-4666-8666-666666666666', '66666666-6666-4666-8666-666666666666') $$,
  'global admin can INSERT into global bucket'
);
WITH del AS (
  DELETE FROM storage.objects WHERE id = '88888888-8888-4888-8888-888888888883' RETURNING id
)
SELECT is((SELECT count(*)::int FROM del), 1, 'global admin can DELETE from global bucket');

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
