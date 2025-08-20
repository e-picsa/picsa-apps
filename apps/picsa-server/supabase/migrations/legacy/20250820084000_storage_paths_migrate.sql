-- Migrate all tables that relied on `storage.objects` generated path column to use
-- shadow `public.storage_objects` path column (supabase update removes permission to modify storage.objects)


-- Remove the old, invalid foreign key constraint.
ALTER TABLE public.deployments
  DROP CONSTRAINT IF EXISTS deployments_icon_path_fkey;

-- Add the new, valid foreign key constraint referencing the mirror table's unique path.
ALTER TABLE public.deployments
  ADD CONSTRAINT deployments_icon_path_fkey
  FOREIGN KEY (icon_path)
  REFERENCES public.storage_objects(path)
  ON DELETE SET NULL;

COMMENT ON COLUMN public.deployments.icon_path IS 'Foreign key to the unique path in public.storage_objects mirror.';


-- 
-- Remove the old, invalid foreign key constraint.
ALTER TABLE public.monitoring_forms
  DROP CONSTRAINT IF EXISTS monitoring_forms_cover_image_fkey;

-- Add the new, valid foreign key constraint referencing the mirror table's unique path.
ALTER TABLE public.monitoring_forms
  ADD CONSTRAINT monitoring_forms_cover_image_fkey
  FOREIGN KEY (cover_image)
  REFERENCES public.storage_objects(path)
  ON DELETE SET NULL;

COMMENT ON COLUMN public.monitoring_forms.cover_image IS 'Foreign key to the unique path in public.storage_objects mirror.';


-- 
-- Remove the old, invalid foreign key constraint.
ALTER TABLE public.resource_collections
  DROP CONSTRAINT IF EXISTS resource_collections_cover_image_fkey;

-- Add the new, valid foreign key constraint referencing the mirror table's unique path.
ALTER TABLE public.resource_collections
  ADD CONSTRAINT resource_collections_cover_image_fkey
  FOREIGN KEY (cover_image)
  REFERENCES public.storage_objects(path)
  ON DELETE SET NULL;

COMMENT ON COLUMN public.resource_collections.cover_image IS 'Foreign key to the unique path in public.storage_objects mirror.';


-- 
-- Remove the old, invalid foreign key constraint.
ALTER TABLE public.resource_files
  DROP CONSTRAINT IF EXISTS resource_files_cover_image_fkey;

-- Add the new, valid foreign key constraint referencing the mirror table's unique path.
ALTER TABLE public.resource_files
  ADD CONSTRAINT resource_files_cover_image_fkey
  FOREIGN KEY (cover_image)
  REFERENCES public.storage_objects(path)
  ON DELETE SET NULL;

COMMENT ON COLUMN public.resource_files.cover_image IS 'Foreign key to the unique path in public.storage_objects mirror.';


-- 
-- Remove the old, invalid foreign key constraint.
ALTER TABLE public.resource_files_child
  DROP CONSTRAINT IF EXISTS resource_files_child_cover_image_fkey;

-- Add the new, valid foreign key constraint referencing the mirror table's unique path.
ALTER TABLE public.resource_files_child
  ADD CONSTRAINT resource_files_child_cover_image_fkey
  FOREIGN KEY (cover_image)
  REFERENCES public.storage_objects(path)
  ON DELETE SET NULL;

COMMENT ON COLUMN public.resource_files_child.cover_image IS 'Foreign key to the unique path in public.storage_objects mirror.';

-- 
-- Remove the old, invalid foreign key constraint.
ALTER TABLE public.forecasts
  DROP CONSTRAINT IF EXISTS forecasts_storage_file_fkey;

-- Add the new, valid foreign key constraint referencing the mirror table's unique path.
ALTER TABLE public.forecasts
  ADD CONSTRAINT forecasts_storage_file_fkey
  FOREIGN KEY (storage_file)
  REFERENCES public.storage_objects(path)
  ON DELETE SET NULL;

COMMENT ON COLUMN public.forecasts.storage_file IS 'Foreign key to the unique path in public.storage_objects mirror.';