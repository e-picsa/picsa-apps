create extension if not exists "pg_cron" with schema "pg_catalog";

create extension if not exists "moddatetime" with schema "extensions";

create schema if not exists "private";

create type "public"."app_role" as enum ('resources.viewer', 'resources.author', 'resources.admin', 'deployments.admin', 'translations.viewer', 'viewer', 'author', 'admin', 'deployments.viewer', 'deployments.author', 'translations.author', 'translations.admin');

create type "public"."country_code" as enum ('global', 'mw', 'zm', 'tj');

create type "public"."forecast_type" as enum ('daily', 'seasonal', 'downscaled', 'weekly');

create type "public"."locale_code" as enum ('global_en', 'mw_ny', 'mw_tum', 'zm_ny', 'tj_tg', 'zm_bem', 'zm_toi', 'zm_loz', 'zm_lun', 'zm_kqn', 'zm_lue');

create type "public"."resource_link_type" as enum ('app', 'social', 'web');


  create table "public"."app_users" (
    "user_id" uuid not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "country_code" text,
    "language_code" text,
    "user_type" text,
    "platform" text
      );


alter table "public"."app_users" enable row level security;


  create table "public"."climate_station_data" (
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "station_id" text not null,
    "country_code" country_code not null,
    "annual_rainfall_data" jsonb[],
    "annual_rainfall_metadata" jsonb,
    "annual_temperature_data" jsonb[],
    "annual_temperature_metadata" jsonb,
    "crop_probability_data" jsonb[],
    "crop_probability_metadata" jsonb,
    "monthly_temperature_data" jsonb[],
    "monthly_temperature_metadata" jsonb,
    "season_start_data" jsonb[],
    "season_start_metadata" jsonb,
    "extremes_data" jsonb[],
    "extremes_metadata" jsonb
      );



  create table "public"."climate_stations" (
    "id" text generated always as (((country_code || '/'::text) || station_id)) stored,
    "station_id" text not null,
    "country_code" text not null,
    "station_name" text,
    "latitude" real,
    "longitude" real,
    "elevation" smallint,
    "district" text
      );



  create table "public"."crop_data" (
    "crop" text not null,
    "variety" text not null,
    "maturity_period" text not null,
    "days_lower" integer not null,
    "days_upper" integer not null,
    "additional_info" text,
    "additional_data" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "id" text not null generated always as (((crop || '/'::text) || variety)) stored
      );



  create table "public"."crop_data_downscaled" (
    "id" text not null generated always as (((country_code || '/'::text) || location_id)) stored,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "country_code" text not null,
    "location_id" text not null,
    "water_requirements" jsonb not null default '{}'::jsonb,
    "override_data" jsonb not null default '{}'::jsonb,
    "station_id" text
      );



  create table "public"."deployments" (
    "id" text not null,
    "country_code" text not null,
    "label" text not null,
    "configuration" jsonb not null default '{}'::jsonb,
    "variant" text default 'extension'::text,
    "access_key_md5" text,
    "public" boolean not null default true,
    "icon_path" text
      );



  create table "public"."forecasts" (
    "id" character varying not null,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "forecast_type" forecast_type,
    "location" text[] default ARRAY[]::text[],
    "country_code" text not null,
    "language_code" text,
    "storage_file" text,
    "mimetype" text
      );



  create table "public"."kobo_sync" (
    "_id" text not null,
    "_created" timestamp with time zone not null default now(),
    "_modified" timestamp with time zone not null default now(),
    "operation" text not null,
    "kobo_form_id" text,
    "kobo_uuid" text,
    "kobo_sync_time" timestamp with time zone,
    "kobo_sync_status" integer,
    "enketo_entry" jsonb,
    "kobo_sync_required" boolean generated always as (((kobo_sync_time IS NULL) OR (kobo_sync_time < _modified))) stored
      );



  create table "public"."monitoring_forms" (
    "created_at" timestamp with time zone not null default now(),
    "title" text not null,
    "description" character varying,
    "enketo_definition" jsonb,
    "summary_fields" jsonb[],
    "enketo_form" text,
    "enketo_model" text,
    "cover_image" text,
    "id" text not null,
    "form_xlsx" text
      );



  create table "public"."monitoring_tool_submissions" (
    "_id" text not null,
    "_created" timestamp with time zone not null default now(),
    "_modified" timestamp with time zone not null default now(),
    "formId" character varying not null,
    "enketoEntry" jsonb not null,
    "json" jsonb not null,
    "_app_user_id" character varying not null,
    "_attachments" jsonb not null,
    "_deleted" boolean not null default false
      );



  create table "public"."resource_collections" (
    "id" text not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "modified_at" timestamp with time zone not null default now(),
    "description" text,
    "title" text not null,
    "cover_image" text default 'global/images/placeholder.svg'::text,
    "resource_collections" text[] default ARRAY[]::text[],
    "resource_files" text[] default ARRAY[]::text[],
    "resource_links" text[] default ARRAY[]::text[],
    "collection_parent" text,
    "sort_order" real not null default '-1'::real,
    "country_code" country_code default 'global'::country_code
      );



  create table "public"."resource_files" (
    "id" text not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "modified_at" timestamp with time zone not null default now(),
    "description" text,
    "storage_file" text,
    "external_url" text,
    "cover_image" text default 'global/images/placeholder.svg'::text,
    "title" text,
    "language_code" text,
    "country_code" country_code not null default 'global'::country_code,
    "sort_order" real not null default '-1'::real,
    "filename" text,
    "size_kb" integer,
    "mimetype" text,
    "md5_checksum" text
      );



  create table "public"."resource_files_child" (
    "id" text not null default gen_random_uuid(),
    "resource_file_id" text not null,
    "created_at" timestamp with time zone not null default now(),
    "modified_at" timestamp with time zone not null default now(),
    "description" text,
    "storage_file" text,
    "external_url" text,
    "cover_image" text,
    "title" text,
    "language_code" text,
    "country_code" country_code not null default 'global'::country_code,
    "sort_order" real not null default '-1'::real,
    "filename" text,
    "size_kb" integer,
    "mimetype" text,
    "md5_checksum" text
      );



  create table "public"."resource_links" (
    "id" text not null default gen_random_uuid(),
    "created_at" timestamp with time zone not null default now(),
    "modified_at" timestamp with time zone not null default now(),
    "description" text,
    "cover_image" text default 'global/images/placeholder.svg'::text,
    "title" text,
    "sort_order" real not null default '-1'::real,
    "type" resource_link_type not null,
    "url" text not null,
    "country_code" country_code default 'global'::country_code
      );



  create table "public"."storage_objects" (
    "id" uuid not null,
    "bucket_id" text,
    "name" text,
    "owner" uuid,
    "created_at" timestamp with time zone,
    "updated_at" timestamp with time zone,
    "last_accessed_at" timestamp with time zone,
    "metadata" jsonb,
    "path" text generated always as (((bucket_id || '/'::text) || name)) stored
      );


alter table "public"."storage_objects" enable row level security;


  create table "public"."translations" (
    "id" text not null,
    "created_at" timestamp with time zone not null default now(),
    "tool" text not null,
    "context" text,
    "text" text not null,
    "mw_ny" text,
    "ke_sw" text,
    "tj_tg" text,
    "zm_ny" text,
    "archived" boolean,
    "zm_bem" text,
    "zm_toi" text,
    "zm_loz" text,
    "zm_lun" text,
    "zm_kqn" text,
    "zm_lue" text,
    "mw_tum" text,
    "updated_at" timestamp with time zone
      );



  create table "public"."user_roles" (
    "created_at" timestamp with time zone not null default now(),
    "deployment_id" text not null,
    "user_id" uuid not null,
    "roles" app_role[] not null default ARRAY[]::app_role[]
      );


CREATE UNIQUE INDEX app_users_pkey ON public.app_users USING btree (user_id);

CREATE UNIQUE INDEX climate_station_data_pkey ON public.climate_station_data USING btree (country_code, station_id);

CREATE UNIQUE INDEX climate_stations_id_key ON public.climate_stations USING btree (id);

CREATE UNIQUE INDEX climate_stations_pkey ON public.climate_stations USING btree (country_code, station_id);

CREATE UNIQUE INDEX crop_data_downscaled_pkey ON public.crop_data_downscaled USING btree (id);

CREATE UNIQUE INDEX crop_data_id_key ON public.crop_data USING btree (id);

CREATE UNIQUE INDEX deployments_pkey ON public.deployments USING btree (id);

CREATE UNIQUE INDEX forecasts_pkey ON public.forecasts USING btree (id);

CREATE UNIQUE INDEX kobo_sync_pkey ON public.kobo_sync USING btree (_id);

CREATE UNIQUE INDEX monitoring_forms_pkey ON public.monitoring_forms USING btree (id);

CREATE UNIQUE INDEX monitoring_tool_submissions_pkey ON public.monitoring_tool_submissions USING btree (_id);

CREATE UNIQUE INDEX resource_collection_pkey ON public.resource_collections USING btree (id);

CREATE UNIQUE INDEX resource_files_child_pkey ON public.resource_files_child USING btree (id);

CREATE UNIQUE INDEX resource_files_pkey ON public.resource_files USING btree (id);

CREATE UNIQUE INDEX resource_links_pkey ON public.resource_links USING btree (id);

CREATE UNIQUE INDEX storage_objects_path_key ON public.storage_objects USING btree (path);

CREATE UNIQUE INDEX storage_objects_pkey ON public.storage_objects USING btree (id);

CREATE UNIQUE INDEX translations_pkey ON public.translations USING btree (id);

CREATE UNIQUE INDEX translations_tool_context_en_key ON public.translations USING btree (tool, context, text);

CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (deployment_id, user_id);

alter table "public"."app_users" add constraint "app_users_pkey" PRIMARY KEY using index "app_users_pkey";

alter table "public"."climate_station_data" add constraint "climate_station_data_pkey" PRIMARY KEY using index "climate_station_data_pkey";

alter table "public"."climate_stations" add constraint "climate_stations_pkey" PRIMARY KEY using index "climate_stations_pkey";

alter table "public"."crop_data" add constraint "crop_data_id_key" PRIMARY KEY using index "crop_data_id_key";

alter table "public"."crop_data_downscaled" add constraint "crop_data_downscaled_pkey" PRIMARY KEY using index "crop_data_downscaled_pkey";

alter table "public"."deployments" add constraint "deployments_pkey" PRIMARY KEY using index "deployments_pkey";

alter table "public"."forecasts" add constraint "forecasts_pkey" PRIMARY KEY using index "forecasts_pkey";

alter table "public"."kobo_sync" add constraint "kobo_sync_pkey" PRIMARY KEY using index "kobo_sync_pkey";

alter table "public"."monitoring_forms" add constraint "monitoring_forms_pkey" PRIMARY KEY using index "monitoring_forms_pkey";

alter table "public"."monitoring_tool_submissions" add constraint "monitoring_tool_submissions_pkey" PRIMARY KEY using index "monitoring_tool_submissions_pkey";

alter table "public"."resource_collections" add constraint "resource_collection_pkey" PRIMARY KEY using index "resource_collection_pkey";

alter table "public"."resource_files" add constraint "resource_files_pkey" PRIMARY KEY using index "resource_files_pkey";

alter table "public"."resource_files_child" add constraint "resource_files_child_pkey" PRIMARY KEY using index "resource_files_child_pkey";

alter table "public"."resource_links" add constraint "resource_links_pkey" PRIMARY KEY using index "resource_links_pkey";

alter table "public"."storage_objects" add constraint "storage_objects_pkey" PRIMARY KEY using index "storage_objects_pkey";

alter table "public"."translations" add constraint "translations_pkey" PRIMARY KEY using index "translations_pkey";

alter table "public"."user_roles" add constraint "user_roles_pkey" PRIMARY KEY using index "user_roles_pkey";

alter table "public"."app_users" add constraint "app_users_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."app_users" validate constraint "app_users_user_id_fkey";

alter table "public"."climate_station_data" add constraint "climate_station_data_station_id_fkey" FOREIGN KEY (station_id) REFERENCES climate_stations(id) ON DELETE CASCADE not valid;

alter table "public"."climate_station_data" validate constraint "climate_station_data_station_id_fkey";

alter table "public"."climate_stations" add constraint "climate_stations_id_key" UNIQUE using index "climate_stations_id_key";

alter table "public"."crop_data_downscaled" add constraint "crop_data_downscaled_station_id_fkey" FOREIGN KEY (station_id) REFERENCES climate_stations(id) ON DELETE SET NULL not valid;

alter table "public"."crop_data_downscaled" validate constraint "crop_data_downscaled_station_id_fkey";

alter table "public"."deployments" add constraint "deployments_icon_path_fkey" FOREIGN KEY (icon_path) REFERENCES storage_objects(path) ON DELETE SET NULL not valid;

alter table "public"."deployments" validate constraint "deployments_icon_path_fkey";

alter table "public"."deployments" add constraint "deployments_variant_check" CHECK (((variant = 'farmer'::text) OR (variant = 'extension'::text) OR (variant = 'other'::text))) not valid;

alter table "public"."deployments" validate constraint "deployments_variant_check";

alter table "public"."forecasts" add constraint "forecasts_storage_file_fkey" FOREIGN KEY (storage_file) REFERENCES storage_objects(path) ON DELETE SET NULL not valid;

alter table "public"."forecasts" validate constraint "forecasts_storage_file_fkey";

alter table "public"."monitoring_forms" add constraint "monitoring_forms_cover_image_fkey" FOREIGN KEY (cover_image) REFERENCES storage_objects(path) ON DELETE SET NULL not valid;

alter table "public"."monitoring_forms" validate constraint "monitoring_forms_cover_image_fkey";

alter table "public"."monitoring_forms" add constraint "monitoring_forms_form_xlsx_fkey" FOREIGN KEY (form_xlsx) REFERENCES storage_objects(path) ON DELETE SET NULL not valid;

alter table "public"."monitoring_forms" validate constraint "monitoring_forms_form_xlsx_fkey";

alter table "public"."resource_collections" add constraint "resource_collections_cover_image_fkey" FOREIGN KEY (cover_image) REFERENCES storage_objects(path) ON DELETE SET NULL not valid;

alter table "public"."resource_collections" validate constraint "resource_collections_cover_image_fkey";

alter table "public"."resource_files" add constraint "resource_files_cover_image_fkey" FOREIGN KEY (cover_image) REFERENCES storage_objects(path) ON DELETE SET NULL not valid;

alter table "public"."resource_files" validate constraint "resource_files_cover_image_fkey";

alter table "public"."resource_files" add constraint "resource_files_storage_file_fkey" FOREIGN KEY (storage_file) REFERENCES storage_objects(path) ON DELETE SET NULL not valid;

alter table "public"."resource_files" validate constraint "resource_files_storage_file_fkey";

alter table "public"."resource_files_child" add constraint "public_resource_files_child_resource_file_id_fkey" FOREIGN KEY (resource_file_id) REFERENCES resource_files(id) ON DELETE CASCADE not valid;

alter table "public"."resource_files_child" validate constraint "public_resource_files_child_resource_file_id_fkey";

alter table "public"."resource_files_child" add constraint "resource_files_child_cover_image_fkey" FOREIGN KEY (cover_image) REFERENCES storage_objects(path) ON DELETE SET NULL not valid;

alter table "public"."resource_files_child" validate constraint "resource_files_child_cover_image_fkey";

alter table "public"."resource_files_child" add constraint "resource_files_child_storage_file_fkey" FOREIGN KEY (storage_file) REFERENCES storage_objects(path) ON DELETE SET NULL not valid;

alter table "public"."resource_files_child" validate constraint "resource_files_child_storage_file_fkey";

alter table "public"."resource_links" add constraint "resource_links_cover_image_fkey" FOREIGN KEY (cover_image) REFERENCES storage_objects(path) ON DELETE SET NULL not valid;

alter table "public"."resource_links" validate constraint "resource_links_cover_image_fkey";

alter table "public"."storage_objects" add constraint "storage_objects_owner_fkey" FOREIGN KEY (owner) REFERENCES auth.users(id) not valid;

alter table "public"."storage_objects" validate constraint "storage_objects_owner_fkey";

alter table "public"."storage_objects" add constraint "storage_objects_path_key" UNIQUE using index "storage_objects_path_key";

alter table "public"."translations" add constraint "translations_tool_context_en_key" UNIQUE using index "translations_tool_context_en_key";

alter table "public"."user_roles" add constraint "public_user_roles_deployment_id_fkey" FOREIGN KEY (deployment_id) REFERENCES deployments(id) ON DELETE CASCADE not valid;

alter table "public"."user_roles" validate constraint "public_user_roles_deployment_id_fkey";

alter table "public"."user_roles" add constraint "public_user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_roles" validate constraint "public_user_roles_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION private.get_secret(secret_name text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$ 
DECLARE 
   secret text;
BEGIN
   SELECT decrypted_secret INTO secret FROM vault.decrypted_secrets WHERE name = secret_name;
   RETURN secret;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.add_kobo_sync_entry()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$ begin -- Handle upsert
if (
  TG_OP = 'CREATE'
  OR TG_OP = 'UPDATE'
) then
insert into
  kobo_sync(_id, operation, enketo_entry)
values
  -- Hack - enketoEntry must be quoted as default to lowercase.
  -- Extract json xml child property, cast to text and then cast to xml data type
  -- TODO - would be cleaner if just storing xml in app instead of enketoEntry json
  -- although would need to be more careful with handling escape characters (can store as xml data type)
  (NEW._id, TG_OP, NEW."enketoEntry") ON CONFLICT (_id) DO
UPDATE
SET
  operation = 'UPDATE',
  enketo_entry = excluded.enketo_entry,
  _modified = excluded._modified;

-- Handle delete
-- TODO - want to avoid updating current row, prefer to delete current and create new 'DELETE' entry
-- (double detection with update followed by delete)
elsif (TG_OP = 'DELETE') then
insert into
  kobo_sync(_id, operation)
values
  (OLD._id, TG_OP) ON CONFLICT (_id) DO
UPDATE
SET
  operation = 'DELETE',
  _modified = excluded._modified;

END IF;

RETURN NULL;

end;

$function$
;

CREATE OR REPLACE FUNCTION public.call_edge_function(name text, body jsonb)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    project_url TEXT;
    full_url TEXT;
    request_id BIGINT;
BEGIN
    -- Fetch the project URL
    project_url := private.get_secret('project_url');

    -- Construct the full URL
    full_url := project_url || '/functions/v1/' || name;

    -- Call the http_request function with the constructed URL
    select (net.http_post(
        url := full_url,
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || private.get_secret('anon_key')
        ),
        body := body,
        timeout_milliseconds := 30000
    )) into request_id;

    return request_id;

END;
$function$
;

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
AS $function$
  declare
    claims jsonb;
    roles_by_deployment jsonb = NULL;
  begin
    -- merge all rows to unique pairs of {[deployment_id]:[roles]}
    select jsonb_object_agg(deployment_id,roles) into roles_by_deployment
    from public.user_roles where user_id = (event->>'user_id')::uuid;
    RAISE NOTICE 'custom_access_token_hook (%)', roles_by_deployment::text;
    claims := event->'claims';
    -- Set picsa_roles claim property to extracted value (or empty jsonb if null)
    claims := jsonb_set(claims, '{picsa_roles}', coalesce(roles_by_deployment,'{}'::jsonb));
    -- Update the 'claims' object in the original event
    event := jsonb_set(event, '{claims}', claims);
    -- Return the modified or original event
    return event;
  end;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_deleted_storage_object()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  DELETE FROM public.storage_objects
  WHERE id = OLD.id;
  RETURN OLD;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_new_storage_object()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.storage_objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata)
  VALUES (NEW.id, NEW.bucket_id, NEW.name, NEW.owner, NEW.created_at, NEW.updated_at, NEW.last_accessed_at, NEW.metadata);
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.sync_updated_storage_object()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.storage_objects
  SET
    bucket_id = NEW.bucket_id,
    name = NEW.name,
    owner = NEW.owner,
    updated_at = NEW.updated_at,
    last_accessed_at = NEW.last_accessed_at,
    metadata = NEW.metadata
  WHERE id = NEW.id;
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."app_users" to "anon";

grant insert on table "public"."app_users" to "anon";

grant references on table "public"."app_users" to "anon";

grant select on table "public"."app_users" to "anon";

grant trigger on table "public"."app_users" to "anon";

grant truncate on table "public"."app_users" to "anon";

grant update on table "public"."app_users" to "anon";

grant delete on table "public"."app_users" to "authenticated";

grant insert on table "public"."app_users" to "authenticated";

grant references on table "public"."app_users" to "authenticated";

grant select on table "public"."app_users" to "authenticated";

grant trigger on table "public"."app_users" to "authenticated";

grant truncate on table "public"."app_users" to "authenticated";

grant update on table "public"."app_users" to "authenticated";

grant delete on table "public"."app_users" to "service_role";

grant insert on table "public"."app_users" to "service_role";

grant references on table "public"."app_users" to "service_role";

grant select on table "public"."app_users" to "service_role";

grant trigger on table "public"."app_users" to "service_role";

grant truncate on table "public"."app_users" to "service_role";

grant update on table "public"."app_users" to "service_role";

grant delete on table "public"."climate_station_data" to "anon";

grant insert on table "public"."climate_station_data" to "anon";

grant references on table "public"."climate_station_data" to "anon";

grant select on table "public"."climate_station_data" to "anon";

grant trigger on table "public"."climate_station_data" to "anon";

grant truncate on table "public"."climate_station_data" to "anon";

grant update on table "public"."climate_station_data" to "anon";

grant delete on table "public"."climate_station_data" to "authenticated";

grant insert on table "public"."climate_station_data" to "authenticated";

grant references on table "public"."climate_station_data" to "authenticated";

grant select on table "public"."climate_station_data" to "authenticated";

grant trigger on table "public"."climate_station_data" to "authenticated";

grant truncate on table "public"."climate_station_data" to "authenticated";

grant update on table "public"."climate_station_data" to "authenticated";

grant delete on table "public"."climate_station_data" to "service_role";

grant insert on table "public"."climate_station_data" to "service_role";

grant references on table "public"."climate_station_data" to "service_role";

grant select on table "public"."climate_station_data" to "service_role";

grant trigger on table "public"."climate_station_data" to "service_role";

grant truncate on table "public"."climate_station_data" to "service_role";

grant update on table "public"."climate_station_data" to "service_role";

grant delete on table "public"."climate_stations" to "anon";

grant insert on table "public"."climate_stations" to "anon";

grant references on table "public"."climate_stations" to "anon";

grant select on table "public"."climate_stations" to "anon";

grant trigger on table "public"."climate_stations" to "anon";

grant truncate on table "public"."climate_stations" to "anon";

grant update on table "public"."climate_stations" to "anon";

grant delete on table "public"."climate_stations" to "authenticated";

grant insert on table "public"."climate_stations" to "authenticated";

grant references on table "public"."climate_stations" to "authenticated";

grant select on table "public"."climate_stations" to "authenticated";

grant trigger on table "public"."climate_stations" to "authenticated";

grant truncate on table "public"."climate_stations" to "authenticated";

grant update on table "public"."climate_stations" to "authenticated";

grant delete on table "public"."climate_stations" to "service_role";

grant insert on table "public"."climate_stations" to "service_role";

grant references on table "public"."climate_stations" to "service_role";

grant select on table "public"."climate_stations" to "service_role";

grant trigger on table "public"."climate_stations" to "service_role";

grant truncate on table "public"."climate_stations" to "service_role";

grant update on table "public"."climate_stations" to "service_role";

grant delete on table "public"."crop_data" to "anon";

grant insert on table "public"."crop_data" to "anon";

grant references on table "public"."crop_data" to "anon";

grant select on table "public"."crop_data" to "anon";

grant trigger on table "public"."crop_data" to "anon";

grant truncate on table "public"."crop_data" to "anon";

grant update on table "public"."crop_data" to "anon";

grant delete on table "public"."crop_data" to "authenticated";

grant insert on table "public"."crop_data" to "authenticated";

grant references on table "public"."crop_data" to "authenticated";

grant select on table "public"."crop_data" to "authenticated";

grant trigger on table "public"."crop_data" to "authenticated";

grant truncate on table "public"."crop_data" to "authenticated";

grant update on table "public"."crop_data" to "authenticated";

grant delete on table "public"."crop_data" to "service_role";

grant insert on table "public"."crop_data" to "service_role";

grant references on table "public"."crop_data" to "service_role";

grant select on table "public"."crop_data" to "service_role";

grant trigger on table "public"."crop_data" to "service_role";

grant truncate on table "public"."crop_data" to "service_role";

grant update on table "public"."crop_data" to "service_role";

grant delete on table "public"."crop_data_downscaled" to "anon";

grant insert on table "public"."crop_data_downscaled" to "anon";

grant references on table "public"."crop_data_downscaled" to "anon";

grant select on table "public"."crop_data_downscaled" to "anon";

grant trigger on table "public"."crop_data_downscaled" to "anon";

grant truncate on table "public"."crop_data_downscaled" to "anon";

grant update on table "public"."crop_data_downscaled" to "anon";

grant delete on table "public"."crop_data_downscaled" to "authenticated";

grant insert on table "public"."crop_data_downscaled" to "authenticated";

grant references on table "public"."crop_data_downscaled" to "authenticated";

grant select on table "public"."crop_data_downscaled" to "authenticated";

grant trigger on table "public"."crop_data_downscaled" to "authenticated";

grant truncate on table "public"."crop_data_downscaled" to "authenticated";

grant update on table "public"."crop_data_downscaled" to "authenticated";

grant delete on table "public"."crop_data_downscaled" to "service_role";

grant insert on table "public"."crop_data_downscaled" to "service_role";

grant references on table "public"."crop_data_downscaled" to "service_role";

grant select on table "public"."crop_data_downscaled" to "service_role";

grant trigger on table "public"."crop_data_downscaled" to "service_role";

grant truncate on table "public"."crop_data_downscaled" to "service_role";

grant update on table "public"."crop_data_downscaled" to "service_role";

grant delete on table "public"."deployments" to "anon";

grant insert on table "public"."deployments" to "anon";

grant references on table "public"."deployments" to "anon";

grant select on table "public"."deployments" to "anon";

grant trigger on table "public"."deployments" to "anon";

grant truncate on table "public"."deployments" to "anon";

grant update on table "public"."deployments" to "anon";

grant delete on table "public"."deployments" to "authenticated";

grant insert on table "public"."deployments" to "authenticated";

grant references on table "public"."deployments" to "authenticated";

grant select on table "public"."deployments" to "authenticated";

grant trigger on table "public"."deployments" to "authenticated";

grant truncate on table "public"."deployments" to "authenticated";

grant update on table "public"."deployments" to "authenticated";

grant delete on table "public"."deployments" to "service_role";

grant insert on table "public"."deployments" to "service_role";

grant references on table "public"."deployments" to "service_role";

grant select on table "public"."deployments" to "service_role";

grant trigger on table "public"."deployments" to "service_role";

grant truncate on table "public"."deployments" to "service_role";

grant update on table "public"."deployments" to "service_role";

grant delete on table "public"."forecasts" to "anon";

grant insert on table "public"."forecasts" to "anon";

grant references on table "public"."forecasts" to "anon";

grant select on table "public"."forecasts" to "anon";

grant trigger on table "public"."forecasts" to "anon";

grant truncate on table "public"."forecasts" to "anon";

grant update on table "public"."forecasts" to "anon";

grant delete on table "public"."forecasts" to "authenticated";

grant insert on table "public"."forecasts" to "authenticated";

grant references on table "public"."forecasts" to "authenticated";

grant select on table "public"."forecasts" to "authenticated";

grant trigger on table "public"."forecasts" to "authenticated";

grant truncate on table "public"."forecasts" to "authenticated";

grant update on table "public"."forecasts" to "authenticated";

grant delete on table "public"."forecasts" to "service_role";

grant insert on table "public"."forecasts" to "service_role";

grant references on table "public"."forecasts" to "service_role";

grant select on table "public"."forecasts" to "service_role";

grant trigger on table "public"."forecasts" to "service_role";

grant truncate on table "public"."forecasts" to "service_role";

grant update on table "public"."forecasts" to "service_role";

grant delete on table "public"."kobo_sync" to "anon";

grant insert on table "public"."kobo_sync" to "anon";

grant references on table "public"."kobo_sync" to "anon";

grant select on table "public"."kobo_sync" to "anon";

grant trigger on table "public"."kobo_sync" to "anon";

grant truncate on table "public"."kobo_sync" to "anon";

grant update on table "public"."kobo_sync" to "anon";

grant delete on table "public"."kobo_sync" to "authenticated";

grant insert on table "public"."kobo_sync" to "authenticated";

grant references on table "public"."kobo_sync" to "authenticated";

grant select on table "public"."kobo_sync" to "authenticated";

grant trigger on table "public"."kobo_sync" to "authenticated";

grant truncate on table "public"."kobo_sync" to "authenticated";

grant update on table "public"."kobo_sync" to "authenticated";

grant delete on table "public"."kobo_sync" to "service_role";

grant insert on table "public"."kobo_sync" to "service_role";

grant references on table "public"."kobo_sync" to "service_role";

grant select on table "public"."kobo_sync" to "service_role";

grant trigger on table "public"."kobo_sync" to "service_role";

grant truncate on table "public"."kobo_sync" to "service_role";

grant update on table "public"."kobo_sync" to "service_role";

grant delete on table "public"."monitoring_forms" to "anon";

grant insert on table "public"."monitoring_forms" to "anon";

grant references on table "public"."monitoring_forms" to "anon";

grant select on table "public"."monitoring_forms" to "anon";

grant trigger on table "public"."monitoring_forms" to "anon";

grant truncate on table "public"."monitoring_forms" to "anon";

grant update on table "public"."monitoring_forms" to "anon";

grant delete on table "public"."monitoring_forms" to "authenticated";

grant insert on table "public"."monitoring_forms" to "authenticated";

grant references on table "public"."monitoring_forms" to "authenticated";

grant select on table "public"."monitoring_forms" to "authenticated";

grant trigger on table "public"."monitoring_forms" to "authenticated";

grant truncate on table "public"."monitoring_forms" to "authenticated";

grant update on table "public"."monitoring_forms" to "authenticated";

grant delete on table "public"."monitoring_forms" to "service_role";

grant insert on table "public"."monitoring_forms" to "service_role";

grant references on table "public"."monitoring_forms" to "service_role";

grant select on table "public"."monitoring_forms" to "service_role";

grant trigger on table "public"."monitoring_forms" to "service_role";

grant truncate on table "public"."monitoring_forms" to "service_role";

grant update on table "public"."monitoring_forms" to "service_role";

grant delete on table "public"."monitoring_tool_submissions" to "anon";

grant insert on table "public"."monitoring_tool_submissions" to "anon";

grant references on table "public"."monitoring_tool_submissions" to "anon";

grant select on table "public"."monitoring_tool_submissions" to "anon";

grant trigger on table "public"."monitoring_tool_submissions" to "anon";

grant truncate on table "public"."monitoring_tool_submissions" to "anon";

grant update on table "public"."monitoring_tool_submissions" to "anon";

grant delete on table "public"."monitoring_tool_submissions" to "authenticated";

grant insert on table "public"."monitoring_tool_submissions" to "authenticated";

grant references on table "public"."monitoring_tool_submissions" to "authenticated";

grant select on table "public"."monitoring_tool_submissions" to "authenticated";

grant trigger on table "public"."monitoring_tool_submissions" to "authenticated";

grant truncate on table "public"."monitoring_tool_submissions" to "authenticated";

grant update on table "public"."monitoring_tool_submissions" to "authenticated";

grant delete on table "public"."monitoring_tool_submissions" to "service_role";

grant insert on table "public"."monitoring_tool_submissions" to "service_role";

grant references on table "public"."monitoring_tool_submissions" to "service_role";

grant select on table "public"."monitoring_tool_submissions" to "service_role";

grant trigger on table "public"."monitoring_tool_submissions" to "service_role";

grant truncate on table "public"."monitoring_tool_submissions" to "service_role";

grant update on table "public"."monitoring_tool_submissions" to "service_role";

grant delete on table "public"."resource_collections" to "anon";

grant insert on table "public"."resource_collections" to "anon";

grant references on table "public"."resource_collections" to "anon";

grant select on table "public"."resource_collections" to "anon";

grant trigger on table "public"."resource_collections" to "anon";

grant truncate on table "public"."resource_collections" to "anon";

grant update on table "public"."resource_collections" to "anon";

grant delete on table "public"."resource_collections" to "authenticated";

grant insert on table "public"."resource_collections" to "authenticated";

grant references on table "public"."resource_collections" to "authenticated";

grant select on table "public"."resource_collections" to "authenticated";

grant trigger on table "public"."resource_collections" to "authenticated";

grant truncate on table "public"."resource_collections" to "authenticated";

grant update on table "public"."resource_collections" to "authenticated";

grant delete on table "public"."resource_collections" to "service_role";

grant insert on table "public"."resource_collections" to "service_role";

grant references on table "public"."resource_collections" to "service_role";

grant select on table "public"."resource_collections" to "service_role";

grant trigger on table "public"."resource_collections" to "service_role";

grant truncate on table "public"."resource_collections" to "service_role";

grant update on table "public"."resource_collections" to "service_role";

grant delete on table "public"."resource_files" to "anon";

grant insert on table "public"."resource_files" to "anon";

grant references on table "public"."resource_files" to "anon";

grant select on table "public"."resource_files" to "anon";

grant trigger on table "public"."resource_files" to "anon";

grant truncate on table "public"."resource_files" to "anon";

grant update on table "public"."resource_files" to "anon";

grant delete on table "public"."resource_files" to "authenticated";

grant insert on table "public"."resource_files" to "authenticated";

grant references on table "public"."resource_files" to "authenticated";

grant select on table "public"."resource_files" to "authenticated";

grant trigger on table "public"."resource_files" to "authenticated";

grant truncate on table "public"."resource_files" to "authenticated";

grant update on table "public"."resource_files" to "authenticated";

grant delete on table "public"."resource_files" to "service_role";

grant insert on table "public"."resource_files" to "service_role";

grant references on table "public"."resource_files" to "service_role";

grant select on table "public"."resource_files" to "service_role";

grant trigger on table "public"."resource_files" to "service_role";

grant truncate on table "public"."resource_files" to "service_role";

grant update on table "public"."resource_files" to "service_role";

grant delete on table "public"."resource_files_child" to "anon";

grant insert on table "public"."resource_files_child" to "anon";

grant references on table "public"."resource_files_child" to "anon";

grant select on table "public"."resource_files_child" to "anon";

grant trigger on table "public"."resource_files_child" to "anon";

grant truncate on table "public"."resource_files_child" to "anon";

grant update on table "public"."resource_files_child" to "anon";

grant delete on table "public"."resource_files_child" to "authenticated";

grant insert on table "public"."resource_files_child" to "authenticated";

grant references on table "public"."resource_files_child" to "authenticated";

grant select on table "public"."resource_files_child" to "authenticated";

grant trigger on table "public"."resource_files_child" to "authenticated";

grant truncate on table "public"."resource_files_child" to "authenticated";

grant update on table "public"."resource_files_child" to "authenticated";

grant delete on table "public"."resource_files_child" to "service_role";

grant insert on table "public"."resource_files_child" to "service_role";

grant references on table "public"."resource_files_child" to "service_role";

grant select on table "public"."resource_files_child" to "service_role";

grant trigger on table "public"."resource_files_child" to "service_role";

grant truncate on table "public"."resource_files_child" to "service_role";

grant update on table "public"."resource_files_child" to "service_role";

grant delete on table "public"."resource_links" to "anon";

grant insert on table "public"."resource_links" to "anon";

grant references on table "public"."resource_links" to "anon";

grant select on table "public"."resource_links" to "anon";

grant trigger on table "public"."resource_links" to "anon";

grant truncate on table "public"."resource_links" to "anon";

grant update on table "public"."resource_links" to "anon";

grant delete on table "public"."resource_links" to "authenticated";

grant insert on table "public"."resource_links" to "authenticated";

grant references on table "public"."resource_links" to "authenticated";

grant select on table "public"."resource_links" to "authenticated";

grant trigger on table "public"."resource_links" to "authenticated";

grant truncate on table "public"."resource_links" to "authenticated";

grant update on table "public"."resource_links" to "authenticated";

grant delete on table "public"."resource_links" to "service_role";

grant insert on table "public"."resource_links" to "service_role";

grant references on table "public"."resource_links" to "service_role";

grant select on table "public"."resource_links" to "service_role";

grant trigger on table "public"."resource_links" to "service_role";

grant truncate on table "public"."resource_links" to "service_role";

grant update on table "public"."resource_links" to "service_role";

grant delete on table "public"."storage_objects" to "anon";

grant insert on table "public"."storage_objects" to "anon";

grant references on table "public"."storage_objects" to "anon";

grant select on table "public"."storage_objects" to "anon";

grant trigger on table "public"."storage_objects" to "anon";

grant truncate on table "public"."storage_objects" to "anon";

grant update on table "public"."storage_objects" to "anon";

grant delete on table "public"."storage_objects" to "authenticated";

grant insert on table "public"."storage_objects" to "authenticated";

grant references on table "public"."storage_objects" to "authenticated";

grant select on table "public"."storage_objects" to "authenticated";

grant trigger on table "public"."storage_objects" to "authenticated";

grant truncate on table "public"."storage_objects" to "authenticated";

grant update on table "public"."storage_objects" to "authenticated";

grant delete on table "public"."storage_objects" to "service_role";

grant insert on table "public"."storage_objects" to "service_role";

grant references on table "public"."storage_objects" to "service_role";

grant select on table "public"."storage_objects" to "service_role";

grant trigger on table "public"."storage_objects" to "service_role";

grant truncate on table "public"."storage_objects" to "service_role";

grant update on table "public"."storage_objects" to "service_role";

grant delete on table "public"."translations" to "anon";

grant insert on table "public"."translations" to "anon";

grant references on table "public"."translations" to "anon";

grant select on table "public"."translations" to "anon";

grant trigger on table "public"."translations" to "anon";

grant truncate on table "public"."translations" to "anon";

grant update on table "public"."translations" to "anon";

grant delete on table "public"."translations" to "authenticated";

grant insert on table "public"."translations" to "authenticated";

grant references on table "public"."translations" to "authenticated";

grant select on table "public"."translations" to "authenticated";

grant trigger on table "public"."translations" to "authenticated";

grant truncate on table "public"."translations" to "authenticated";

grant update on table "public"."translations" to "authenticated";

grant delete on table "public"."translations" to "service_role";

grant insert on table "public"."translations" to "service_role";

grant references on table "public"."translations" to "service_role";

grant select on table "public"."translations" to "service_role";

grant trigger on table "public"."translations" to "service_role";

grant truncate on table "public"."translations" to "service_role";

grant update on table "public"."translations" to "service_role";

grant delete on table "public"."user_roles" to "service_role";

grant insert on table "public"."user_roles" to "service_role";

grant references on table "public"."user_roles" to "service_role";

grant select on table "public"."user_roles" to "service_role";

grant trigger on table "public"."user_roles" to "service_role";

grant truncate on table "public"."user_roles" to "service_role";

grant update on table "public"."user_roles" to "service_role";

grant delete on table "public"."user_roles" to "supabase_auth_admin";

grant insert on table "public"."user_roles" to "supabase_auth_admin";

grant references on table "public"."user_roles" to "supabase_auth_admin";

grant select on table "public"."user_roles" to "supabase_auth_admin";

grant trigger on table "public"."user_roles" to "supabase_auth_admin";

grant truncate on table "public"."user_roles" to "supabase_auth_admin";

grant update on table "public"."user_roles" to "supabase_auth_admin";


  create policy "Users can insert their own app_user"
  on "public"."app_users"
  as permissive
  for insert
  to authenticated
with check ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can update their own app_user"
  on "public"."app_users"
  as permissive
  for update
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Users can view their own data only"
  on "public"."app_users"
  as permissive
  for select
  to authenticated
using ((( SELECT auth.uid() AS uid) = user_id));



  create policy "Allow public read access"
  on "public"."storage_objects"
  as permissive
  for select
  to public
using (true);



  create policy "Allow auth admin to read user roles"
  on "public"."user_roles"
  as permissive
  for select
  to supabase_auth_admin
using (true);


CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.app_users FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.climate_station_data FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.forecasts FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');

CREATE TRIGGER trigger_kobo_sync_function AFTER INSERT OR UPDATE ON public.kobo_sync FOR EACH ROW EXECUTE FUNCTION supabase_functions.http_request('http://172.17.0.1:54321/functions/v1/kobo-sync', 'POST', '{"Content-Type":"application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"}', '{}', '1000');

CREATE TRIGGER monitoring_tool_kobo_sync AFTER INSERT OR DELETE OR UPDATE ON public.monitoring_tool_submissions FOR EACH ROW EXECUTE FUNCTION add_kobo_sync_entry();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.translations FOR EACH ROW EXECUTE FUNCTION moddatetime('updated_at');


  create policy "Storage global public DELETE"
  on "storage"."objects"
  as permissive
  for delete
  to public
using ((bucket_id = 'global'::text));



  create policy "Storage global public INSERT"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'global'::text));



  create policy "Storage global public SELECT"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'global'::text));



  create policy "Storage global public UPDATE"
  on "storage"."objects"
  as permissive
  for update
  to public
using ((bucket_id = 'global'::text));



  create policy "Storage mw public DELETE"
  on "storage"."objects"
  as permissive
  for delete
  to public
using ((bucket_id = 'mw'::text));



  create policy "Storage mw public INSERT"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'mw'::text));



  create policy "Storage mw public SELECT"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'mw'::text));



  create policy "Storage mw public UPDATE"
  on "storage"."objects"
  as permissive
  for update
  to public
using ((bucket_id = 'mw'::text));



  create policy "Storage resources public DELETE"
  on "storage"."objects"
  as permissive
  for delete
  to public
using ((bucket_id = 'resources'::text));



  create policy "Storage resources public INSERT"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'resources'::text));



  create policy "Storage resources public SELECT"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'resources'::text));



  create policy "Storage resources public UPDATE"
  on "storage"."objects"
  as permissive
  for update
  to public
using ((bucket_id = 'resources'::text));



  create policy "Storage zm public DELETE"
  on "storage"."objects"
  as permissive
  for delete
  to public
using ((bucket_id = 'zm'::text));



  create policy "Storage zm public INSERT"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check ((bucket_id = 'zm'::text));



  create policy "Storage zm public SELECT"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'zm'::text));



  create policy "Storage zm public UPDATE"
  on "storage"."objects"
  as permissive
  for update
  to public
using ((bucket_id = 'zm'::text));


CREATE TRIGGER on_storage_object_created AFTER INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION sync_new_storage_object();

CREATE TRIGGER on_storage_object_deleted AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION sync_deleted_storage_object();

CREATE TRIGGER on_storage_object_updated AFTER UPDATE ON storage.objects FOR EACH ROW WHEN ((old.* IS DISTINCT FROM new.*)) EXECUTE FUNCTION sync_updated_storage_object();


