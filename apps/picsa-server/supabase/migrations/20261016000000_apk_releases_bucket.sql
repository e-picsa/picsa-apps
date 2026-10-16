-- Universal APK releases storage bucket for peer-to-peer offline app sharing.
--
-- IDEMPOTENT: safe to re-apply if the bucket/policy was created manually.
-- Bucket insert converges on (id, public) via ON CONFLICT DO UPDATE, and
-- policy is dropped before re-creation (Postgres has no CREATE POLICY IF NOT EXISTS).
-- Writes remain service_role only (populated by android-sync-apk workflow); public gets read-only access.

insert into storage.buckets (id, name, public)
values ('apk-releases', 'apk-releases', true)
on conflict (id) do update set name = excluded.name, public = excluded.public;

drop policy if exists "Storage apk-releases public SELECT" on storage.objects;
create policy "Storage apk-releases public SELECT" on storage.objects for select
  to public using (bucket_id = 'apk-releases');
