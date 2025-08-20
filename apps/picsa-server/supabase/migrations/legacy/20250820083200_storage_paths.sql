-- Create a shadow_table to mirror internal `storage.objects` table and append a custom
-- `path` column that provides fully-qualified path to object ({bucket_id}/{name})

DROP VIEW IF EXISTS public.storage_objects;

CREATE TABLE public.storage_objects (
  id UUID PRIMARY KEY,
  bucket_id TEXT,
  name TEXT,
  owner UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  metadata JSONB,
  -- A generated column for the full path, with unique enforcement
  path TEXT GENERATED ALWAYS AS (bucket_id || '/' || name) STORED,
  constraint storage_objects_path_key unique (path)
);

-- Add comments to the columns for clarity
COMMENT ON TABLE public.storage_objects IS 'A public, read-only mirror of the storage.objects table, kept in sync with triggers.';
COMMENT ON COLUMN public.storage_objects.id IS 'Matches the id from storage.objects.';
COMMENT ON COLUMN public.storage_objects.path IS 'A convenient, auto-generated full path to the object.';

-- IMPORTANT: Enable Row Level Security on your new table
ALTER TABLE public.storage_objects ENABLE ROW LEVEL SECURITY;

-- Note: You must add RLS policies to this table. For example, to allow
-- anyone to read all objects (adjust as needed):
CREATE POLICY "Allow public read access" ON public.storage_objects
FOR SELECT USING (true);


-- STEP 2: CREATE THE SYNC FUNCTIONS
-- ----------------------------------------------------------------------------
-- These PostgreSQL functions will contain the logic to replicate changes
-- from `storage.objects` to our new `storage_objects` table.
-- `SECURITY DEFINER` is crucial as it allows the function to access the
-- protected `storage` schema.

-- Function to handle new file uploads (INSERTS)
CREATE OR REPLACE FUNCTION public.sync_new_storage_object()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.storage_objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata)
  VALUES (NEW.id, NEW.bucket_id, NEW.name, NEW.owner, NEW.created_at, NEW.updated_at, NEW.last_accessed_at, NEW.metadata);
  RETURN NEW;
END;
$$;

-- Function to handle file updates (e.g., moving a file)
CREATE OR REPLACE FUNCTION public.sync_updated_storage_object()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.storage_objects
  SET
    bucket_id = NEW.bucket_id,
    name = NEW.name,
    owner = NEW.owner,
    updated_at = NEW.updated_at,
    last_accessed_at = NEW.last_accessed_at,
    metadata = NEW.metadata
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

-- Function to handle file deletions
CREATE OR REPLACE FUNCTION public.sync_deleted_storage_object()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.storage_objects
  WHERE id = OLD.id;
  RETURN OLD;
END;
$$;


-- STEP 3: CREATE THE TRIGGERS
-- ----------------------------------------------------------------------------
-- These triggers will automatically execute the functions above whenever a
-- change occurs in the `storage.objects` table.

-- Trigger for INSERTS
CREATE TRIGGER on_storage_object_created
  AFTER INSERT ON storage.objects
  FOR EACH ROW
  EXECUTE PROCEDURE public.sync_new_storage_object();

-- Trigger for UPDATES
-- The `WHEN` clause is an optimization to prevent the trigger from firing
-- if an update operation doesn't actually change any data.
CREATE TRIGGER on_storage_object_updated
  AFTER UPDATE ON storage.objects
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE PROCEDURE public.sync_updated_storage_object();

-- Trigger for DELETES
CREATE TRIGGER on_storage_object_deleted
  AFTER DELETE ON storage.objects
  FOR EACH ROW
  EXECUTE PROCEDURE public.sync_deleted_storage_object();


-- STEP 4: BACKFILL EXISTING DATA (RUN THIS ONCE)
-- ----------------------------------------------------------------------------
-- The triggers only work for changes made *after* they are created.
-- This command copies all data that already exists in storage.
-- The `ON CONFLICT` clause makes it safe to run even if some data has
-- already been synced, preventing errors.

INSERT INTO public.storage_objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata)
SELECT id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata
FROM storage.objects
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================