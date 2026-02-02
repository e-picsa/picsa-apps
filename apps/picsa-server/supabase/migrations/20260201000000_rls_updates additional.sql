---------------- kobo_sync   ---------------------------------------
-- Not currently used, will review implementation in future focused
-- on backend function integration (no direct access)

-- Enable RLS
ALTER TABLE public.kobo_sync ENABLE ROW LEVEL SECURITY;

-- Authenticated - none
REVOKE ALL ON TABLE public.kobo_sync FROM authenticated;

-- Anonymous - none
REVOKE ALL ON TABLE public.kobo_sync FROM anon;


---------------- resource_collections   ---------------------------------------
-- Auditing
alter table public.resource_collections add column updated_at timestamp with time zone;
alter table public.resource_collections add column owner UUID default auth.uid() REFERENCES auth.users(id);
select audit.enable_table_audit('public', 'resource_collections', 'id');

-- Enable RLS
ALTER TABLE public.resource_collections ENABLE ROW LEVEL SECURITY;

-- Authenticated - read/write (all users)
REVOKE ALL ON TABLE public.resource_collections FROM authenticated;
GRANT ALL ON TABLE public.resource_collections TO authenticated;

CREATE POLICY "resource_collections:read:authenticated" ON public.resource_collections
FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "resource_collections:create:authenticated" ON public.resource_collections
FOR INSERT TO authenticated 
WITH CHECK (owner IS NOT NULL AND auth.uid() = owner); -- ensure populated

CREATE POLICY "resource_collections:update:owner_only" ON public.resource_collections
FOR UPDATE TO authenticated 
USING (auth.uid() = owner)
WITH CHECK (auth.uid() = owner);

CREATE POLICY "resource_collections:delete:owner_only" ON public.resource_collections
FOR DELETE TO authenticated 
USING (auth.uid() = owner);

-- Anonymous - none
REVOKE ALL ON TABLE public.resource_collections FROM anon;

---------------- resource_files   ---------------------------------------
-- Auditing
alter table public.resource_files add column updated_at timestamp with time zone;
alter table public.resource_files add column owner UUID default auth.uid() REFERENCES auth.users(id);
select audit.enable_table_audit('public', 'resource_files', 'id');

-- Enable RLS
ALTER TABLE public.resource_files ENABLE ROW LEVEL SECURITY;

-- Authenticated - read/write (all users)
REVOKE ALL ON TABLE public.resource_files FROM authenticated;
GRANT ALL ON TABLE public.resource_files TO authenticated;

CREATE POLICY "resource_files:read:authenticated" ON public.resource_files
FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "resource_files:create:authenticated" ON public.resource_files
FOR INSERT TO authenticated 
WITH CHECK (owner IS NOT NULL AND auth.uid() = owner); -- ensure populated

CREATE POLICY "resource_files:update:owner_only" ON public.resource_files
FOR UPDATE TO authenticated 
USING (auth.uid() = owner)
WITH CHECK (auth.uid() = owner);

CREATE POLICY "resource_files:delete:owner_only" ON public.resource_files
FOR DELETE TO authenticated 
USING (auth.uid() = owner);

-- Anonymous - none
REVOKE ALL ON TABLE public.resource_files FROM anon;

---------------- resource_files_child   ---------------------------------------
-- Auditing
alter table public.resource_files_child add column updated_at timestamp with time zone;
alter table public.resource_files_child add column owner UUID default auth.uid() REFERENCES auth.users(id);
select audit.enable_table_audit('public', 'resource_files_child', 'id');

-- Enable RLS
ALTER TABLE public.resource_files_child ENABLE ROW LEVEL SECURITY;

-- Authenticated - read/write (all users)
REVOKE ALL ON TABLE public.resource_files_child FROM authenticated;
GRANT ALL ON TABLE public.resource_files_child TO authenticated;

CREATE POLICY "resource_files_child:read:authenticated" ON public.resource_files_child
FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "resource_files_child:create:authenticated" ON public.resource_files_child
FOR INSERT TO authenticated 
WITH CHECK (owner IS NOT NULL AND auth.uid() = owner); -- ensure populated

CREATE POLICY "resource_files_child:update:owner_only" ON public.resource_files_child
FOR UPDATE TO authenticated 
USING (auth.uid() = owner)
WITH CHECK (auth.uid() = owner);

CREATE POLICY "resource_files_child:delete:owner_only" ON public.resource_files_child
FOR DELETE TO authenticated 
USING (auth.uid() = owner);

-- Anonymous - none
REVOKE ALL ON TABLE public.resource_files_child FROM anon;


---------------- resource_links   ---------------------------------------
-- Auditing
alter table public.resource_links add column updated_at timestamp with time zone;
alter table public.resource_links add column owner UUID default auth.uid() REFERENCES auth.users(id);
select audit.enable_table_audit('public', 'resource_links', 'id');

-- Enable RLS
ALTER TABLE public.resource_links ENABLE ROW LEVEL SECURITY;

-- Authenticated - read/write (all users)
REVOKE ALL ON TABLE public.resource_links FROM authenticated;
GRANT ALL ON TABLE public.resource_links TO authenticated;

CREATE POLICY "resource_links:read:authenticated" ON public.resource_links
FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "resource_links:create:authenticated" ON public.resource_links
FOR INSERT TO authenticated 
WITH CHECK (owner IS NOT NULL AND auth.uid() = owner); -- ensure populated

CREATE POLICY "resource_links:update:owner_only" ON public.resource_links
FOR UPDATE TO authenticated 
USING (auth.uid() = owner)
WITH CHECK (auth.uid() = owner);

CREATE POLICY "resource_links:delete:owner_only" ON public.resource_links
FOR DELETE TO authenticated 
USING (auth.uid() = owner);

-- Anonymous - none
REVOKE ALL ON TABLE public.resource_links FROM anon;


---------------- translations   ---------------------------------------
-- Auditing
select audit.enable_table_audit('public', 'translations', 'id');

-- Enable RLS
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Authenticated - read/write (all users)
REVOKE ALL ON TABLE public.translations FROM authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.translations TO authenticated;

CREATE POLICY "translations:read:authenticated" ON public.translations
FOR SELECT TO authenticated 
USING (true);

CREATE POLICY "translations:create:authenticated" ON public.translations
FOR INSERT TO authenticated 
WITH CHECK (true);

CREATE POLICY "translations:update:authenticated" ON public.translations
FOR UPDATE TO authenticated 
USING (true)
WITH CHECK (true);


-- Anonymous - none
REVOKE ALL ON TABLE public.translations FROM anon;
