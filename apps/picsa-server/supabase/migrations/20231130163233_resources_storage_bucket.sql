-- Use Postgres to create a bucket.

insert into storage.buckets (id, name, public)
values ('resources',
        'resources',
        true);

-- Make resources fully accessisble to public
-- NOTE - SELECT and UPDATE requires `WITH CHECK` whilst others require `USING`
-- https://www.postgresql.org/docs/current/sql-createpolicy.html#:~:text=The%20USING%20expression%20determines%20which,stored%20back%20into%20the%20relation.
 -- TODO - try to limit some actions to authentciated (needs troubleshooting)
--  https://supabase.com/docs/guides/storage/security/access-control

CREATE POLICY "Storage resources public INSERT" ON storage.objects
FOR
INSERT TO public WITH CHECK (bucket_id = 'resources');


CREATE POLICY "Storage resources public SELECT" ON storage.objects
FOR
SELECT TO public USING (bucket_id = 'resources');


CREATE POLICY "Storage resources public UPDATE" ON storage.objects
FOR
UPDATE TO public USING (bucket_id = 'resources');


CREATE POLICY "Storage resources public DELETE" ON storage.objects
FOR
DELETE TO public USING (bucket_id = 'resources');

-- CREATE POLICY "(debug) full access" ON "storage"."objects" AS PERMISSIVE
-- FOR ALL TO authenticated WITH CHECK (bucket_id = 'resources')