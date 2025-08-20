-- List resource entries from private storage.objects table
CREATE VIEW storage_objects AS
SELECT
  *
FROM
  storage.objects;

-- create or replace function storage_objects_list() 
-- returns setof Record language plpgsql security definer
-- set search_path = public as $$ 
-- begin 
--   return query
--   select * from storage.objects;
-- end;
-- $$