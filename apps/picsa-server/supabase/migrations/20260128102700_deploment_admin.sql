alter table public.deployments drop column variant;

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
