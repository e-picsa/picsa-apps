alter table public.deployments drop column variant;
alter table public.deployments add column "created_at" timestamp with time zone not null default now();
alter table public.deployments add column "updated_at" timestamp with time zone not null default now();

SELECT audit.enable_table_audit(
    'public',                -- schema
    'climate_station_data',  -- table
    'station_id',            -- PK column
    ARRAY['updated_at']      -- excluded columns (ignored in diffs)
);

-- Permissions

-- Table-level Permissions
GRANT ALL ON TABLE public.deployments to supabase_auth_admin;
REVOKE ALL ON TABLE public.deployments from authenticated, anon;
GRANT SELECT ON TABLE "public"."deployments" TO "authenticated";

-- Row Level Permssions
alter table "public"."deployments" enable row level security;
create policy "Enable read access for authenticated users"
on "public"."deployments"
for select
to authenticated
using (true);
