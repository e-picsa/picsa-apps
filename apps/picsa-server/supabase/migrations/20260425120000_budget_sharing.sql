-- ============================================================
-- Schema
-- Create `budget` schema to separate budget data from public api.
-- Ensure permissions for authenticated and service_role 
-- ============================================================
CREATE SCHEMA IF NOT EXISTS budget;

-- ============================================================
-- Tables
-- Create budgets table for share codes
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "moddatetime" SCHEMA extensions;

CREATE TABLE budget.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deployment_id TEXT NOT NULL REFERENCES public.deployments(id),
    enterprise_id text NOT NULL,
    title text NOT NULL,
    description text NULL,
    data JSONB NOT NULL, -- core budget data
    meta JSONB NOT NULL, -- month start, scale etc.
    summary JSONB NOT NULL, -- computed total labor, profit/loss etc.
    schema_version integer not null,
    share_code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Permissions
-- Users access via api only to share or download shared budget
-- ============================================================

-- Schema visibility
GRANT USAGE ON SCHEMA budget TO authenticated, service_role;

-- service_role gets everything (it bypasses RLS anyway)
GRANT ALL ON ALL TABLES    IN SCHEMA budget TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA budget TO service_role;
GRANT ALL ON ALL ROUTINES  IN SCHEMA budget TO service_role;

-- service_role gets everything (it bypasses RLS anyway)
-- Enable RLS
ALTER TABLE budget.budgets ENABLE ROW LEVEL SECURITY;

-- Restrict direct access (service role only)
REVOKE ALL ON TABLE budget.budgets FROM authenticated;
REVOKE ALL ON TABLE budget.budgets FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE budget.budgets TO service_role;

-- Keep updated_at current
DROP TRIGGER IF EXISTS handle_updated_at ON budget.budgets;
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON budget.budgets
FOR EACH ROW
EXECUTE FUNCTION extensions.moddatetime('updated_at');

