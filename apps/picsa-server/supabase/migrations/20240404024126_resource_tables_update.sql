create table
  public.resource_collections (
    id text not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    modified_at timestamp with time zone not null default now(),
    description text null,
    title text not null,
    cover_image text null,
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



create table public.resource_files (
    id text not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    modified_at timestamp with time zone not null default now(),
    description text,
    storage_file text null,
    cover_image text null,
    title text null,
    resource_parent text,
    language_code text,
    sort_order real not null default '-1'::real,
    constraint resource_files_pkey primary key (id),
    constraint resource_files_cover_image_fkey foreign key (cover_image) references storage.objects (path) on update cascade on delete set null,
    constraint resource_files_storage_file_fkey foreign key (storage_file) references storage.objects (path) on update cascade on delete set null
    );


create table
  public.resource_links (
    id text not null default gen_random_uuid (),
    created_at timestamp with time zone not null default now(),
    modified_at timestamp with time zone not null default now(),
    description text,
    cover_image text null,
    title text null,
    sort_order real not null default '-1'::real,
    type text null,
    url text not null,
    constraint resource_links_pkey primary key (id),
    constraint resource_links_cover_image_fkey foreign key (cover_image) references storage.objects (path) on update cascade on delete set null
  ) tablespace pg_default;

-- delete legacy combined resources table
DROP table public.resources;

-- delete specific resources bucket (prefer deployment-level folders)
DELETE FROM storage.buckets WHERE id='resources';