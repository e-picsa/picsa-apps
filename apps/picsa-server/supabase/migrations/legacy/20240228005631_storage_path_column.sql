-- Add fully qualified storage paths to storage.objects table (bucket + name)
AlTER TABLE storage.objects add column 
"path" text GENERATED ALWAYS AS (bucket_id || '/' || name) STORED
;

-- Set unique constraint on qualified storage path
ALTER TABLE storage.objects add constraint 
"storage_path_key" unique (path)
;