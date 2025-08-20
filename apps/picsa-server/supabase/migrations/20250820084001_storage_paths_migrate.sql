-- 
-- Additional constraints

ALTER TABLE public.resource_collections
  DROP CONSTRAINT IF EXISTS public_resource_collection_cover_image_fkey;


-- Remove the old, invalid foreign key constraint.
ALTER TABLE public.resource_files
  DROP CONSTRAINT IF EXISTS resource_files_storage_file_fkey;

-- Add the new, valid foreign key constraint referencing the mirror table's unique path.
ALTER TABLE public.resource_files
  ADD CONSTRAINT resource_files_storage_file_fkey
  FOREIGN KEY (storage_file)
  REFERENCES public.storage_objects(path)
  ON DELETE SET NULL;

COMMENT ON COLUMN public.resource_files.storage_file IS 'Foreign key to the unique path in public.storage_objects mirror.';


-- Remove the old, invalid foreign key constraint.
ALTER TABLE public.resource_files_child
  DROP CONSTRAINT IF EXISTS resource_files_child_storage_file_fkey;

-- Add the new, valid foreign key constraint referencing the mirror table's unique path.
ALTER TABLE public.resource_files_child
  ADD CONSTRAINT resource_files_child_storage_file_fkey
  FOREIGN KEY (storage_file)
  REFERENCES public.storage_objects(path)
  ON DELETE SET NULL;

COMMENT ON COLUMN public.resource_files_child.storage_file IS 'Foreign key to the unique path in public.storage_objects mirror.';