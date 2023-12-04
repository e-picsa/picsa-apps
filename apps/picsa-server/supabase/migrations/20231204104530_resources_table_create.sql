CREATE TABLE IF NOT EXISTS "public"."resources" (
  "id" text not null default gen_random_uuid (),
  "created_at" timestamp with time zone not null default now(),
  "modified_at" timestamp with time zone not null default now(),
  "type" text not null,
  "description" text null,
  "storage_cover" jsonb null,
  "storage_file" uuid null,
  constraint resources_pkey primary key (id),
  constraint resources_storage_file_fkey foreign key (storage_file) references storage.objects (id) on update cascade on delete cascade
);

CREATE POLICY "Resources authenticated public access" ON "public"."resources" AS PERMISSIVE FOR ALL TO PUBLIC USING (true)