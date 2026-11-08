-- Drop legacy monitoring tool and Kobo Toolbox sync backend
-- Frontend tool was removed from dashboard and app; tables are locked down with no policies.
-- This migration removes the sync queue, form definitions, submissions, triggers and helper function.

-- Drop triggers first (IF EXISTS for idempotency across environments)
DROP TRIGGER IF EXISTS trigger_kobo_sync_function ON public.kobo_sync;
DROP TRIGGER IF EXISTS monitoring_tool_kobo_sync ON public.monitoring_tool_submissions;

-- Drop helper function used only by monitoring_tool_kobo_sync trigger
DROP FUNCTION IF EXISTS public.add_kobo_sync_entry();

-- Drop legacy tables (grants, RLS policies and indexes drop with tables)
DROP TABLE IF EXISTS public.monitoring_tool_submissions;
DROP TABLE IF EXISTS public.monitoring_forms;
DROP TABLE IF EXISTS public.kobo_sync;
