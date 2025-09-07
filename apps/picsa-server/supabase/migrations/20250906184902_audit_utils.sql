-- Function for bulk trigger setup
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
    -- Build argument lists
    audit_args := array_to_string(
        ARRAY[quote_literal(p_pk_column)] || 
        array(SELECT quote_literal(col) FROM unnest(p_excluded_columns) AS col), 
        ', '
    );
    
    noop_args := array_to_string(
        array(SELECT quote_literal(col) FROM unnest(p_excluded_columns) AS col), 
        ', '
    );
    
    -- Create audit trigger
    EXECUTE format(
        'CREATE TRIGGER audit_trigger 
         AFTER INSERT OR UPDATE OR DELETE ON %I.%I
         FOR EACH ROW
         EXECUTE FUNCTION audit.audit_with_diff(%s)',
        p_schema, p_table, audit_args
    );
    
    -- Create noop prevention trigger (only if there are excluded columns)
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


-- Function to get audit history for a record
-- Not currently in use but could be helpful in future
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



-- Function to clean old audit records
CREATE OR REPLACE FUNCTION audit.cleanup_old_records(
    retention_days INT DEFAULT 365
)
RETURNS INT AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM audit.audit_log
    WHERE changed_at < (now() - (retention_days || ' days')::interval);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;


-- Function to remove audit triggers from a table
CREATE OR REPLACE FUNCTION audit.remove_table_audit(
    p_schema TEXT,
    p_table TEXT
)
RETURNS VOID AS $$
BEGIN
    -- Drop triggers if they exist
    EXECUTE format('DROP TRIGGER IF EXISTS audit_trigger ON %I.%I', p_schema, p_table);
    EXECUTE format('DROP TRIGGER IF EXISTS prevent_noop_update_trigger ON %I.%I', p_schema, p_table);
    
    RAISE NOTICE 'Audit triggers removed from %.%', p_schema, p_table;
END;
$$ LANGUAGE plpgsql;