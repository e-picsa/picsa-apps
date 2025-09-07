-- ============================================================
-- Function: setup_table_audit
-- Purpose: Bulk setup of audit triggers for a table
--
-- Usage:
--   -- Basic usage with a single-column primary key
--   SELECT audit.setup_table_audit(
--       'public',                -- schema name
--       'my_table',              -- table name
--       'id',                    -- primary key column
--       ARRAY['updated_at']      -- excluded columns (ignored in diffs)
--   );
--
--   -- ⚠️ NOTE: If the table has a composite primary key
--   -- (e.g. country_code + station_id), the current version
--   -- of audit_with_diff only supports a single PK column.
--   -- You may need to extend audit_with_diff to accept multiple
--   -- PK columns and concatenate them into pk_value.
-- ============================================================
CREATE OR REPLACE FUNCTION audit.setup_table_audit(
    p_schema TEXT,
    p_table TEXT,
    p_pk_column TEXT,
    p_excluded_columns TEXT[] DEFAULT ARRAY['updated_at']
)
RETURNS VOID AS $$
DECLARE
    audit_args TEXT;
    noop_args TEXT;
BEGIN
    audit_args := array_to_string(
        ARRAY[quote_literal(p_pk_column)] || 
        array(SELECT quote_literal(col) FROM unnest(p_excluded_columns) AS col), 
        ', '
    );

    noop_args := array_to_string(
        array(SELECT quote_literal(col) FROM unnest(p_excluded_columns) AS col), 
        ', '
    );

    -- Drop existing triggers if re-running
    EXECUTE format('DROP TRIGGER IF EXISTS audit_trigger ON %I.%I', p_schema, p_table);
    EXECUTE format('DROP TRIGGER IF EXISTS prevent_noop_update_trigger ON %I.%I', p_schema, p_table);

    -- Create audit trigger
    EXECUTE format(
        'CREATE TRIGGER audit_trigger 
         AFTER INSERT OR UPDATE OR DELETE ON %I.%I
         FOR EACH ROW
         EXECUTE FUNCTION audit.audit_with_diff(%s)',
        p_schema, p_table, audit_args
    );

    -- Create noop prevention trigger (only if excluded columns exist)
    IF array_length(p_excluded_columns, 1) > 0 THEN
        EXECUTE format(
            'CREATE TRIGGER prevent_noop_update_trigger
             BEFORE UPDATE ON %I.%I
             FOR EACH ROW
             EXECUTE FUNCTION audit.prevent_noop_update(%s)',
            p_schema, p_table, noop_args
        );
    END IF;

    RAISE NOTICE 'Audit setup complete for %.% with PK "%" excluding columns: %', 
        p_schema, p_table, p_pk_column, 
        CASE WHEN array_length(p_excluded_columns, 1) > 0 
             THEN array_to_string(p_excluded_columns, ', ')
             ELSE 'none'
        END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Function: get_record_history
-- Purpose: Retrieve audit history for a specific record
--
-- Usage:
--   -- Get last 50 changes for a record
--   SELECT * FROM audit.get_record_history(
--       'public',                -- schema name
--       'my_table',              -- table name
--       '123',                   -- primary key value (as text)
--       50                       -- optional limit (default 50)
--   );
--
--   -- Example for climate_station_data
--   SELECT * FROM audit.get_record_history(
--       'public',
--       'climate_station_data',
--       'station-001'
--   );
-- ============================================================
CREATE OR REPLACE FUNCTION audit.get_record_history(
    p_schema TEXT,
    p_table TEXT,
    p_pk_value TEXT,
    p_limit INT DEFAULT 50
)
RETURNS TABLE(
    operation TEXT,
    changed_at TIMESTAMPTZ,
    changed_by_email TEXT,
    diff_added JSONB,
    diff_removed JSONB,
    new_data JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.operation,
        al.changed_at,
        al.changed_by_email,
        al.diff_added,
        al.diff_removed,
        al.new_data
    FROM audit.audit_log al
    WHERE al.schema_name = p_schema
      AND al.table_name = p_table
      AND al.pk_value = p_pk_value
    ORDER BY al.changed_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- Function: cleanup_old_records
-- Purpose: Delete audit records older than retention_days
--
-- Usage:
--   -- Delete records older than 365 days (default)
--   SELECT audit.cleanup_old_records();
--
--   -- Delete records older than 90 days
--   SELECT audit.cleanup_old_records(90);
--
--   -- Returns the number of rows deleted
-- ============================================================
CREATE OR REPLACE FUNCTION audit.cleanup_old_records(
    retention_days INT DEFAULT 365
)
RETURNS BIGINT AS $$  -- BIGINT for large tables
DECLARE
    deleted_count BIGINT;
BEGIN
    DELETE FROM audit.audit_log
    WHERE changed_at < (now() - (retention_days || ' days')::interval);

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Function: remove_table_audit
-- Purpose: Remove audit triggers from a table
--
-- Usage:
--   -- Remove audit triggers from a table
--   SELECT audit.remove_table_audit(
--       'public',                -- schema name
--       'my_table'               -- table name
--   );
--
--   -- Example for climate_station_data
--   SELECT audit.remove_table_audit(
--       'public',
--       'climate_station_data'
--   );
-- ============================================================
CREATE OR REPLACE FUNCTION audit.remove_table_audit(
    p_schema TEXT,
    p_table TEXT
)
RETURNS VOID AS $$ 
BEGIN
    EXECUTE format('DROP TRIGGER IF EXISTS audit_trigger ON %I.%I', p_schema, p_table);
    EXECUTE format('DROP TRIGGER IF EXISTS prevent_noop_update_trigger ON %I.%I', p_schema, p_table);

    RAISE NOTICE 'Audit triggers removed from %.%', p_schema, p_table;
END;
$$ LANGUAGE plpgsql;