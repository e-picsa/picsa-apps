CREATE TABLE IF NOT EXISTS public.debug_logs (
  id serial not null,
  payload text null,
  created_at timestamp with time zone not null default now(),
  constraint debug_logs_pkey primary key (id)
) TABLESPACE pg_default;

-- RLS - service role access only
ALTER TABLE public.debug_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.debug_logs FROM anon;
REVOKE ALL ON TABLE public.debug_logs FROM authenticated;