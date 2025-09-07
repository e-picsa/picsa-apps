-- ============================================================
-- Function: prevent_noop_update
-- Purpose: Cancel updates if no meaningful data changed
-- ============================================================
CREATE OR REPLACE FUNCTION audit.prevent_noop_update()
RETURNS TRIGGER AS $$
DECLARE
    old_row JSONB;
    new_row JSONB;
    col TEXT;
BEGIN
    -- Build row JSON
    old_row := to_jsonb(OLD.*);
    new_row := to_jsonb(NEW.*);
    
    -- Remove excluded columns (passed as trigger arguments)
    FOR i IN 0..TG_NARGS-1 LOOP
        col := TG_ARGV[i];
        old_row := old_row - col;
        new_row := new_row - col;
    END LOOP;

    IF old_row IS NOT DISTINCT FROM new_row THEN
        RETURN NULL; -- cancel update if nothing meaningful changed
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Function: jsonb_recursive_diff
-- Purpose: Compute recursive JSONB diffs between old and new rows
-- ============================================================
CREATE OR REPLACE FUNCTION audit.jsonb_recursive_diff(old JSONB, new JSONB)
RETURNS TABLE(added JSONB, removed JSONB) AS $$
DECLARE
    key TEXT;
    old_val JSONB;
    new_val JSONB;
    sub_added JSONB;
    sub_removed JSONB;
    add_obj JSONB := '{}'::jsonb;
    rem_obj JSONB := '{}'::jsonb;
    all_keys TEXT[];
BEGIN
    -- Handle null inputs
    IF old IS NULL THEN old := '{}'::jsonb; END IF;
    IF new IS NULL THEN new := '{}'::jsonb; END IF;
    
    -- Get all unique keys from both objects
    SELECT ARRAY(
        SELECT DISTINCT unnest(
            ARRAY(SELECT jsonb_object_keys(old)) || 
            ARRAY(SELECT jsonb_object_keys(new))
        )
    ) INTO all_keys;

    FOREACH key IN ARRAY all_keys
    LOOP
        old_val := old -> key;
        new_val := new -> key;

        IF old_val IS NULL AND new_val IS NOT NULL THEN
            -- Key was added
            add_obj := add_obj || jsonb_build_object(key, new_val);

        ELSIF new_val IS NULL AND old_val IS NOT NULL THEN
            -- Key was removed
            rem_obj := rem_obj || jsonb_build_object(key, old_val);

        ELSIF jsonb_typeof(old_val) = 'object' 
           AND jsonb_typeof(new_val) = 'object' THEN
            -- Both are objects, recurse
            SELECT diff.added, diff.removed
            INTO sub_added, sub_removed
            FROM audit.jsonb_recursive_diff(old_val, new_val) AS diff;

            -- Only add to result if there are actual changes
            IF sub_added IS NOT NULL AND sub_added != '{}'::jsonb THEN
                add_obj := add_obj || jsonb_build_object(key, sub_added);
            END IF;
            IF sub_removed IS NOT NULL AND sub_removed != '{}'::jsonb THEN
                rem_obj := rem_obj || jsonb_build_object(key, sub_removed);
            END IF;

        ELSIF old_val IS DISTINCT FROM new_val THEN
            -- Values are different
            add_obj := add_obj || jsonb_build_object(key, new_val);
            rem_obj := rem_obj || jsonb_build_object(key, old_val);
        END IF;
    END LOOP;

    -- Return NULL for empty objects - fixed the boolean logic
    added := CASE 
        WHEN add_obj = '{}'::jsonb THEN NULL 
        ELSE add_obj 
    END;
    removed := CASE 
        WHEN rem_obj = '{}'::jsonb THEN NULL 
        ELSE rem_obj 
    END;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;


-- ============================================================
-- Function: audit_with_diff
-- Purpose: Trigger function to log INSERT/UPDATE/DELETE with diffs
-- Usage: 
--   CREATE TRIGGER audit_trigger
--   AFTER INSERT OR UPDATE OR DELETE ON my_table
--   FOR EACH ROW
--   EXECUTE FUNCTION audit.audit_with_diff('id', 'updated_at');
-- ============================================================
CREATE OR REPLACE FUNCTION audit.audit_with_diff()
RETURNS TRIGGER AS $$
DECLARE
    pk_value TEXT;
    pk_column TEXT;
    old_row JSONB;
    new_row JSONB;
    added JSONB;
    removed JSONB;
    user_email TEXT;
    col TEXT;
    error_context TEXT;
BEGIN
    -- Require at least PK column argument
    IF TG_NARGS = 0 THEN
        RAISE EXCEPTION 'audit.audit_with_diff() requires primary key column name as first argument';
    END IF;

    BEGIN
        -- Extract user email from JWT claims
        BEGIN
            user_email := (current_setting('request.jwt.claims', true)::jsonb ->> 'email');
        EXCEPTION WHEN others THEN
            user_email := NULL;
        END;

        -- First argument is PK column
        pk_column := TG_ARGV[0];

        -- Extract PK value
        pk_value := CASE WHEN TG_OP = 'DELETE'
                        THEN to_jsonb(OLD.*) ->> pk_column
                        ELSE to_jsonb(NEW.*) ->> pk_column
                    END;

        -- Validate PK value exists
        IF pk_value IS NULL THEN
            RAISE EXCEPTION 'Primary key column "%" not found or is NULL in table %.%', 
                pk_column, TG_TABLE_SCHEMA, TG_TABLE_NAME;
        END IF;

        IF (TG_OP = 'UPDATE') THEN
            -- Build row JSON
            old_row := to_jsonb(OLD.*);
            new_row := to_jsonb(NEW.*);
            
            -- Remove excluded columns (arguments 1+ are excluded columns)
            FOR i IN 1..TG_NARGS-1 LOOP
                col := TG_ARGV[i];
                old_row := old_row - col;
                new_row := new_row - col;
            END LOOP;

            -- Prevent no-op updates
            IF old_row IS NOT DISTINCT FROM new_row THEN
                RETURN NULL;
            END IF;

            -- Compute recursive diff
            SELECT diff.added, diff.removed
            INTO added, removed
            FROM audit.jsonb_recursive_diff(old_row, new_row) AS diff;

            INSERT INTO audit.audit_log(
                schema_name, table_name, operation, pk_value,
                new_data, diff_added, diff_removed,
                changed_by, changed_by_email
            )
            VALUES (
                TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP, pk_value,
                to_jsonb(NEW.*), added, removed,
                auth.uid(), user_email
            );

            RETURN NEW;

        ELSIF (TG_OP = 'INSERT') THEN
            INSERT INTO audit.audit_log(
                schema_name, table_name, operation, pk_value, new_data,
                changed_by, changed_by_email
            )
            VALUES (
                TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP, pk_value, to_jsonb(NEW.*),
                auth.uid(), user_email
            );

            RETURN NEW;

        ELSIF (TG_OP = 'DELETE') THEN
            INSERT INTO audit.audit_log(
                schema_name, table_name, operation, pk_value, new_data,
                changed_by, changed_by_email
            )
            VALUES (
                TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP, pk_value, to_jsonb(OLD.*),
                auth.uid(), user_email
            );

            RETURN OLD;
        END IF;

    EXCEPTION WHEN others THEN
        -- Log the error but don't fail the original operation
        GET STACKED DIAGNOSTICS error_context = PG_EXCEPTION_CONTEXT;
        RAISE WARNING 'Audit trigger failed for table %.%: % - %', 
            TG_TABLE_SCHEMA, TG_TABLE_NAME, SQLERRM, error_context;
        
        -- Return appropriate value to continue the operation
        CASE TG_OP
            WHEN 'DELETE' THEN RETURN OLD;
            ELSE RETURN NEW;
        END CASE;
    END;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
