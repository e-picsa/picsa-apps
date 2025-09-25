create table
  public.resource_collections (
    id text not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    modified_at timestamp with time zone not null default now(),
    description text null,
    title text not null,
    cover_image text default 'global/images/placeholder.svg',
    resource_collections text[] default array[]::text[],
    resource_files text[] default array[]::text[],
    resource_links text[] default array[]::text[],
    collection_parent text null,
    sort_order real not null default '-1'::real,
    constraint resource_collection_pkey primary key (id),
    -- NOTE - self-reference in constraint fails when seeding, will generate instead from children
    -- constraint public_resource_collection_collection_parent_fkey foreign key (collection_parent) references resource_collections (id),
    constraint public_resource_collection_cover_image_fkey foreign key (cover_image) references storage.objects (path) on delete set null
  ) tablespace pg_default;



create table
  public.resource_files (
    id text not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    modified_at timestamp with time zone not null default now(),
    description text null,
    storage_file text null,
    external_url text null,
    cover_image text default 'global/images/placeholder.svg',
    title text null,
    language_code text null,
    country_code text null,
    sort_order real not null default '-1'::real,
    filename text null,
    size_kb integer null,
    mimetype text null,
    md5_checksum text null,
    constraint resource_files_pkey primary key (id),
    constraint resource_files_cover_image_fkey foreign key (cover_image) references storage.objects (path) on update cascade on delete set null,
    constraint resource_files_storage_file_fkey foreign key (storage_file) references storage.objects (path) on update cascade on delete set null
  ) tablespace pg_default;

create table
  public.resource_files_child (
    id text not null default gen_random_uuid (),
    resource_file_id text not null,
    created_at timestamp with time zone not null default now(),
    modified_at timestamp with time zone not null default now(),
    description text null,
    storage_file text null,
    external_url text null,
    cover_image text null,
    title text null,
    language_code text null,
    country_code text null,
    sort_order real not null default '-1'::real,
    filename text null,
    size_kb integer null,
    mimetype text null,
    md5_checksum text null,
    constraint resource_files_child_pkey primary key (id),
    constraint resource_files_child_cover_image_fkey foreign key (cover_image) references storage.objects (path) on update cascade on delete set null,
    constraint resource_files_child_storage_file_fkey foreign key (storage_file) references storage.objects (path) on update cascade on delete set null,
    constraint public_resource_files_child_resource_file_id_fkey foreign key (resource_file_id) references resource_files (id) on delete cascade
  ) tablespace pg_default;
COMMENT ON TABLE public.resource_files_child IS 'Resource file child variants, such as alternate language or';

create type public.resource_link_type as enum ('app','social', 'web');

create table
  public.resource_links (
    id text not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    modified_at timestamp with time zone not null default now(),
    description text,
    cover_image text default 'global/images/placeholder.svg',
    title text null,
    sort_order real not null default '-1'::real,
    type resource_link_type not null,
    url text not null,
    constraint resource_links_pkey primary key (id),
    constraint resource_links_cover_image_fkey foreign key (cover_image) references storage.objects (path) on update cascade on delete set null
  ) tablespace pg_default;

-- delete legacy combined resources table
DROP table public.resources;

-- delete specific resources bucket (prefer deployment-level folders)
DELETE FROM storage.buckets WHERE id='resources';