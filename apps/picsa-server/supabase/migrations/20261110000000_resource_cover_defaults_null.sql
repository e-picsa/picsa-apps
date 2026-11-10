-- Drop legacy 'global/images/placeholder.svg' column defaults on resource tables
alter table public.resource_collections alter column cover_image drop default;
alter table public.resource_files alter column cover_image drop default;
alter table public.resource_links alter column cover_image drop default;
