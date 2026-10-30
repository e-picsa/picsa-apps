-- ZW country storage bucket and public policies, mirroring the existing
-- mw/zm configuration (see legacy/20240215194323_country_storage_buckets.sql).
--
-- IDEMPOTENT: safe to re-apply if the bucket/policies were created manually.
-- Bucket insert converges on (name, public) via ON CONFLICT DO UPDATE, and
-- policies are dropped before re-creation (Postgres has no CREATE POLICY IF NOT EXISTS).
-- NOTE: manual pre-application must use the same policy names below, otherwise
-- duplicate permissive policies will remain (harmless for access, untidy in schema).

-- ZW bucket (public, matching mw/zm)
insert into storage.buckets (id, name, public)
values ('zw', 'zw', true)
on conflict (id) do update set name = excluded.name, public = excluded.public;

-- ZW storage policies
drop policy if exists "Storage zw public INSERT" on storage.objects;
create policy "Storage zw public INSERT" on storage.objects for insert
  to public with check (bucket_id = 'zw');

drop policy if exists "Storage zw public SELECT" on storage.objects;
create policy "Storage zw public SELECT" on storage.objects for select
  to public using (bucket_id = 'zw');

drop policy if exists "Storage zw public UPDATE" on storage.objects;
create policy "Storage zw public UPDATE" on storage.objects for update
  to public using (bucket_id = 'zw');

drop policy if exists "Storage zw public DELETE" on storage.objects;
create policy "Storage zw public DELETE" on storage.objects for delete to public using (bucket_id = 'zw');
