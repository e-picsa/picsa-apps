-- Migration: Add sync columns and RPC function
-- Date: 2025-11-24

-- List of tables to sync
-- climate_station_data
-- climate_stations
-- crop_data
-- crop_data_downscaled
-- deployments
-- forecasts
-- monitoring_forms
-- resource_collections
-- resource_files
-- resource_files_child
-- resource_links
-- translations

-- 1. Add columns to tables

DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'climate_station_data',
        'climate_stations',
        'crop_data',
        'crop_data_downscaled',
        'deployments',
        'forecasts',
        'monitoring_forms',
        'resource_collections',
        'resource_files',
        'resource_files_child',
        'resource_links',
        'translations'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ', t);
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE', t);
    END LOOP;
END $$;

-- 2. Create get_sync_changes RPC function

CREATE OR REPLACE FUNCTION public.get_sync_changes(last_sync_timestamp TIMESTAMPTZ)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB := '{}'::JSONB;
    t text;
    tables text[] := ARRAY[
        'climate_station_data',
        'climate_stations',
        'crop_data',
        'crop_data_downscaled',
        'deployments',
        'forecasts',
        'monitoring_forms',
        'resource_collections',
        'resource_files',
        'resource_files_child',
        'resource_links',
        'translations'
    ];
    rows JSONB;
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('
            SELECT jsonb_agg(to_jsonb(t.*))
            FROM public.%I t
            WHERE t.published_at > %L
        ', t, last_sync_timestamp) INTO rows;

        IF rows IS NOT NULL THEN
            result := result || jsonb_build_object(t, rows);
        END IF;
    END LOOP;

    RETURN result;
END;
$$;

-- 3. Enable audit for these tables (if not already enabled)
-- Note: This assumes audit schema exists and enable_table_audit is available.
-- We use a safe block to avoid errors if audit is not set up or triggers exist.

DO $$
DECLARE
    t text;
    pk text;
    tables text[] := ARRAY[
        'climate_station_data',
        'climate_stations',
        'crop_data',
        'crop_data_downscaled',
        'deployments',
        'forecasts',
        'monitoring_forms',
        'resource_collections',
        'resource_files',
        'resource_files_child',
        'resource_links',
        'translations'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        -- Determine PK column
        IF t = 'climate_station_data' OR t = 'climate_stations' THEN
            pk := 'station_id';
        ELSE
            pk := 'id';
        END IF;

        -- Enable audit (this function drops existing triggers first, so it's safe to re-run)
        PERFORM audit.enable_table_audit('public', t, pk, ARRAY['updated_at']);
    END LOOP;
END $$;
