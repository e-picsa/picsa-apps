-- Alter resource table cover_image defaults to null instead of 'global/images/placeholder.svg'
alter table public.resource_collections alter column cover_image drop default;
alter table public.resource_files alter column cover_image drop default;
alter table public.resource_links alter column cover_image drop default;

-- Ensure any existing rows referencing the dummy placeholder string are updated to null
update public.resource_collections set cover_image = null where cover_image = 'global/images/placeholder.svg';
update public.resource_files set cover_image = null where cover_image = 'global/images/placeholder.svg';
update public.resource_links set cover_image = null where cover_image = 'global/images/placeholder.svg';
