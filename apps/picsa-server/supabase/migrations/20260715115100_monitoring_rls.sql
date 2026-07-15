-- Block access to legacy monitoring forms and submission data (pending delete)
revoke all on table public.monitoring_forms from anon, authenticated;
revoke all on table public.monitoring_tool_submissions from anon, authenticated;
 
alter table public.monitoring_forms enable row level security;
alter table public.monitoring_tool_submissions enable row level security;

-- NOTE "monitoring.admin" app_role still exists, could be recreated but assume fine for now
 