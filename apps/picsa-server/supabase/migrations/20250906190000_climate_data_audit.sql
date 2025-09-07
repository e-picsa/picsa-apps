SELECT audit.disable_table_audit(
    'public',                -- schema
    'climate_station_data',  -- table
    'station_id',            -- PK column
    ARRAY['updated_at']      -- excluded columns (ignored in diffs)
);

SELECT audit.enable_table_audit(
    'public',                -- schema
    'climate_station_data',  -- table
    'station_id',            -- PK column
    ARRAY['updated_at']      -- excluded columns (ignored in diffs)
);

