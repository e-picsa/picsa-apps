-- Demo placeholder language (`xx_qaa`): replaces the demo Chichewa column.
-- A genuine second Chichewa (`xx_ny`) raised "which Chichewa is canonical?"
-- confusion with `mw_ny`, so the demo uses a clearly-labeled placeholder
-- language instead. Real Chichewa work belongs in `mw_ny`.
-- The language code is `qaa`: the ISO 639 `qaa–qtz` range is reserved for
-- private/local use, so it can never collide with a genuine language
-- (unlike `aa`, which is Afar, or `xx`, which mirrors the country code).
--
-- IDEMPOTENT: safe to re-apply (IF NOT EXISTS / conditional deletes).
-- Nothing references the dropped column yet (it was only ever seeded locally),
-- so no data migration is required.
BEGIN;

-- Drop the demo Chichewa column in favour of the placeholder language below.
ALTER TABLE public.translations DROP COLUMN IF EXISTS xx_ny;

-- Remove the demo Chichewa locale ...
DELETE FROM geo.locales WHERE code = 'ny-XX';

-- ... and add the placeholder demo language instead.
INSERT INTO geo.locales (language_code, name, local_name, country_code)
VALUES ('qaa', 'Demo Language', 'Demo', 'XX')
ON CONFLICT (code) DO UPDATE SET name = excluded.name, local_name = excluded.local_name;

-- Demo translations column for the placeholder language. (Replaces the
-- dropped xx_ny column above; seeded with 2 explanatory rows by demo:reset.)
ALTER TABLE public.translations ADD COLUMN IF NOT EXISTS xx_qaa text;

COMMIT;
