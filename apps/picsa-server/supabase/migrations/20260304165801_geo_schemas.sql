
-- ============================================================
-- Schema
-- Create `geo` schema to separate geo data from public api.
-- Ensure permissions for authenticated and service_role 
-- ============================================================
CREATE SCHEMA IF NOT EXISTS geo;

-- ============================================================
-- Countries
-- PK is the ISO 3166-1 alpha-2 code (e.g. 'US', 'GB', 'JP')
-- Using the code as PK so foreign keys read as `country_code`
-- rather than an opaque id — self-documenting across the DB.
-- ============================================================
CREATE TABLE geo.countries (
  code        CHAR(2)     PRIMARY KEY
    CONSTRAINT country_code_format CHECK (code ~ '^[A-Z]{2}$'),
  name        TEXT        NOT NULL,
  local_name  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON COLUMN geo.countries.code IS 'ISO 3166-1 alpha-2 country code';

ALTER TABLE geo.countries ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Locales
-- Each row is a language + optional region.
-- language_code is ISO 639-1 (2-letter) where available,
-- otherwise ISO 639-3 (3-letter).
-- ============================================================
CREATE TABLE geo.locales (
  language_code VARCHAR(3)  NOT NULL
    CONSTRAINT language_code_format
      CHECK (language_code ~ '^[a-z]{2,3}$'),
  country_code  CHAR(2)     REFERENCES geo.countries (code),
  code          TEXT         GENERATED ALWAYS AS (
    language_code || COALESCE('-' || country_code, '')
  ) STORED PRIMARY KEY,
  name          TEXT         NOT NULL,
  local_name    TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

COMMENT ON COLUMN geo.locales.language_code
  IS 'ISO 639-1 (alpha-2) or ISO 639-3 (alpha-3) language code';

ALTER TABLE geo.locales ENABLE ROW LEVEL SECURITY; 

-- ============================================================
-- Boundaries
-- Stores administrative boundary TopoJSON per country/level.
--
-- Labels manually populated, can be looked up at:
-- https://wiki.openstreetmap.org/wiki/Tag:boundary%3Dadministrative
-- ============================================================
CREATE TABLE geo.boundaries (
  country_code  CHAR(2)     NOT NULL REFERENCES geo.countries (code) ON DELETE CASCADE,
  -- e.g. 2 - national, 3-11 subnational
  admin_level   SMALLINT    NOT NULL
    CONSTRAINT boundaries_admin_level_positive CHECK (admin_level > 1),
  label         TEXT,        -- e.g. 'Province', 'District'  ,
  feature_count INTEGER NOT NULL,
  bbox          DOUBLE PRECISION[] NOT NULL,
  topojson      JSONB       NOT NULL,
  size_kb       INTEGER NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  PRIMARY KEY (country_code, admin_level)
);

CREATE INDEX idx_boundaries_country_level
  ON geo.boundaries (country_code, admin_level);

ALTER TABLE geo.boundaries ENABLE ROW LEVEL SECURITY; 


-- ============================================================
-- Permissions
-- ============================================================

-- Schema visibility
GRANT USAGE ON SCHEMA geo TO authenticated, service_role;

-- service_role gets everything (it bypasses RLS anyway)
GRANT ALL ON ALL TABLES    IN SCHEMA geo TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA geo TO service_role;
GRANT ALL ON ALL ROUTINES  IN SCHEMA geo TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA geo GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA geo GRANT ALL ON SEQUENCES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA geo GRANT ALL ON ROUTINES  TO service_role;

-- authenticated readonly (will populate via functions and migrations)
GRANT SELECT ON ALL TABLES IN SCHEMA geo TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA geo TO authenticated;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA geo TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA geo GRANT SELECT ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA geo GRANT USAGE ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA geo GRANT EXECUTE ON ROUTINES TO authenticated;  


-- ============================================================
-- Roles
-- Include "app.admin" role that will be used to manage global
-- app data such as map boundaries
-- ============================================================
alter type public.app_role ADD VALUE 'app.admin';