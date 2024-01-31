CREATE TABLE IF NOT EXISTS "public"."resources" (
    "id" text not null default gen_random_uuid (),
    "created_at" timestamp with time zone not null default now(),
    "modified_at" timestamp with time zone not null default now(),
    "type" text not null,
    "description" text not null default ''::text,
    "storage_file" uuid null,
    "storage_cover" uuid null,
    "title" text null,
    constraint resources_pkey primary key (id),
    constraint resources_storage_cover_fkey foreign key (storage_cover) references storage.objects (id) on update cascade on delete set null,
    constraint resources_storage_file_fkey foreign key (storage_file) references storage.objects (id) on update cascade on delete set null);

CREATE POLICY "Resources authenticated public access" ON "public"."resources" AS PERMISSIVE FOR ALL TO PUBLIC USING (true)