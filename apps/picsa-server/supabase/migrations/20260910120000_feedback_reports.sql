-- ============================================================
-- Feedback reports
-- Stores in-app user feedback and bug reports submitted via the
-- feedback edge function. All client access goes through edge
-- functions (service_role only).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "moddatetime" SCHEMA extensions;

create table public.feedback_reports (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('feedback', 'bug_report')),
  user_id uuid references auth.users(id) on delete set null,
  comment text not null check (char_length(comment) between 1 and 2000),
  device_info jsonb not null default '{}'::jsonb,
  screenshot_path text,
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved', 'closed')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index feedback_reports_status_idx on public.feedback_reports (status);
create index feedback_reports_type_idx on public.feedback_reports (type);
create index feedback_reports_created_at_idx on public.feedback_reports (created_at desc);

-- ============================================================
-- Permissions — service_role only (accessed via edge functions)
-- ============================================================
alter table public.feedback_reports enable row level security;

revoke all on public.feedback_reports from anon, authenticated;

grant all on public.feedback_reports to service_role;

-- Keep updated_at current
drop trigger if exists handle_updated_at on public.feedback_reports;
create trigger handle_updated_at
before update on public.feedback_reports
for each row
execute function extensions.moddatetime('updated_at');

-- ============================================================
-- Storage — private bucket for screenshots (service role only)
-- ============================================================
insert into storage.buckets (id, name, public) values ('feedback-screenshots', 'feedback-screenshots', false)
on conflict (id) do nothing;
