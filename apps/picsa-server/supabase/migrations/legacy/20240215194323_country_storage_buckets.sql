-- GLOBAL
insert into
  storage.buckets (id, name, public)
values
  ('global', 'global', true);

CREATE POLICY "Storage global public INSERT" ON storage.objects FOR
INSERT
  TO public WITH CHECK (bucket_id = 'global');

CREATE POLICY "Storage global public SELECT" ON storage.objects FOR
SELECT
  TO public USING (bucket_id = 'global');

CREATE POLICY "Storage global public UPDATE" ON storage.objects FOR
UPDATE
  TO public USING (bucket_id = 'global');

CREATE POLICY "Storage global public DELETE" ON storage.objects FOR DELETE TO public USING (bucket_id = 'global');

-- MW
insert into
  storage.buckets (id, name, public)
values
  ('mw', 'mw', true);

CREATE POLICY "Storage mw public INSERT" ON storage.objects FOR
INSERT
  TO public WITH CHECK (bucket_id = 'mw');

CREATE POLICY "Storage mw public SELECT" ON storage.objects FOR
SELECT
  TO public USING (bucket_id = 'mw');

CREATE POLICY "Storage mw public UPDATE" ON storage.objects FOR
UPDATE
  TO public USING (bucket_id = 'mw');

CREATE POLICY "Storage mw public DELETE" ON storage.objects FOR DELETE TO public USING (bucket_id = 'mw');

-- ZM
insert into
  storage.buckets (id, name, public)
values
  ('zm', 'zm', true);

CREATE POLICY "Storage zm public INSERT" ON storage.objects FOR
INSERT
  TO public WITH CHECK (bucket_id = 'zm');

CREATE POLICY "Storage zm public SELECT" ON storage.objects FOR
SELECT
  TO public USING (bucket_id = 'zm');

CREATE POLICY "Storage zm public UPDATE" ON storage.objects FOR
UPDATE
  TO public USING (bucket_id = 'zm');

CREATE POLICY "Storage zm public DELETE" ON storage.objects FOR DELETE TO public USING (bucket_id = 'zm');
