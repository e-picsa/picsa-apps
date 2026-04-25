-- Create budgets table for share codes
CREATE TABLE public.budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_code TEXT NOT NULL UNIQUE,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Restrict direct access (service role only)
REVOKE ALL ON TABLE public.budgets FROM authenticated;
REVOKE ALL ON TABLE public.budgets FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.budgets TO service_role;

-- Keep updated_at current
DROP TRIGGER IF EXISTS handle_updated_at ON public.budgets;
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.budgets
FOR EACH ROW
EXECUTE FUNCTION extensions.moddatetime('updated_at');
