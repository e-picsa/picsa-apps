-- Expression indexes for dashboard feedback filters (device_info->>'app_version' / ->>'os')
create index if not exists feedback_reports_app_version_idx on public.feedback_reports ((device_info ->> 'app_version'));
create index if not exists feedback_reports_os_idx on public.feedback_reports ((device_info ->> 'os'));
