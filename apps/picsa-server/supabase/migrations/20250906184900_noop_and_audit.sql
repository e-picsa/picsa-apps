-- Create function to prevent row updates if data unchanged
CREATE OR REPLACE FUNCTION audit.prevent_noop_update()
RETURNS TRIGGER AS $$
DECLARE
    old_row JSONB;
    new_row JSONB;
BEGIN
    -- Build row JSON without updated_at
    old_row := to_jsonb(OLD.*) - 'updated_at';
    new_row := to_jsonb(NEW.*) - 'updated_at';

    IF old_row IS NOT DISTINCT FROM new_row THEN
        RETURN NULL; -- cancel update if nothing but updated_at changed
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Create table to store audit data
CREATE SCHEMA IF NOT EXISTS audit;

-- Main audit log table
CREATE TABLE IF NOT EXISTS audit.audit_log (
    id BIGSERIAL PRIMARY KEY,
    schema_name TEXT NOT NULL,       -- schema of the audited table
    table_name TEXT NOT NULL,        -- name of the audited table
    operation TEXT NOT NULL,         -- 'INSERT', 'UPDATE', 'DELETE'
    row_pk JSONB NOT NULL,           -- primary key(s) of the row
    new_data JSONB,                  -- row after change
    diff_added JSONB,                -- JSONB keys/values added or changed
    diff_removed JSONB,              -- JSONB keys/values removed or changed
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    changed_by UUID DEFAULT auth.uid(),  -- Supabase user UUID
    changed_by_email TEXT             -- optional: Supabase user email
);

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


-- Create function to store table change history (audit) with diffs
CREATE OR REPLACE FUNCTION audit.audit_with_diff()
RETURNS TRIGGER AS $$
DECLARE
    pk JSONB;
    old_row JSONB;
    new_row JSONB;
    added JSONB;
    removed JSONB;
    user_email TEXT;
BEGIN
    -- Extract user email from JWT claims
    BEGIN
        user_email := (current_setting('request.jwt.claims', true)::jsonb ->> 'email');
    EXCEPTION WHEN others THEN
        user_email := NULL;
    END;

    -- Build PK JSON (works for single-column PKs; extend for composite if needed)
    pk := jsonb_build_object(
        (SELECT a.attname
         FROM pg_index i
         JOIN pg_attribute a ON a.attrelid = i.indrelid
                            AND a.attnum = ANY(i.indkey)
         WHERE i.indrelid = TG_RELID
           AND i.indisprimary
         LIMIT 1),
        CASE WHEN TG_OP = 'DELETE'
             THEN to_jsonb(OLD.*)->>(SELECT a.attname
                                     FROM pg_index i
                                     JOIN pg_attribute a ON a.attrelid = i.indrelid
                                                        AND a.attnum = ANY(i.indkey)
                                     WHERE i.indrelid = TG_RELID
                                       AND i.indisprimary
                                     LIMIT 1)
             ELSE to_jsonb(NEW.*)->>(SELECT a.attname
                                     FROM pg_index i
                                     JOIN pg_attribute a ON a.attrelid = i.indrelid
                                                        AND a.attnum = ANY(i.indkey)
                                     WHERE i.indrelid = TG_RELID
                                       AND i.indisprimary
                                     LIMIT 1)
        END
    );

    IF (TG_OP = 'UPDATE') THEN
        -- Exclude noisy columns
        old_row := to_jsonb(OLD.*) - 'updated_at';
        new_row := to_jsonb(NEW.*) - 'updated_at';

        -- Prevent no-op updates
        IF old_row IS NOT DISTINCT FROM new_row THEN
            RETURN NULL;
        END IF;

        -- Compute recursive diff
        SELECT diff.added, diff.removed
        INTO added, removed
        FROM audit.jsonb_recursive_diff(old_row, new_row) AS diff;

        INSERT INTO audit.audit_log(
            schema_name, table_name, operation, row_pk,
            new_data, diff_added, diff_removed,
            changed_by, changed_by_email
        )
        VALUES (
            TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP, pk,
            to_jsonb(NEW.*), added, removed,
            auth.uid(), user_email
        );

        RETURN NEW;

    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit.audit_log(
            schema_name, table_name, operation, row_pk, new_data,
            changed_by, changed_by_email
        )
        VALUES (
            TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP, pk, to_jsonb(NEW.*),
            auth.uid(), user_email
        );

        RETURN NEW;

    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit.audit_log(
            schema_name, table_name, operation, row_pk, new_data,
            changed_by, changed_by_email
        )
        VALUES (
            TG_TABLE_SCHEMA, TG_TABLE_NAME, TG_OP, pk, to_jsonb(OLD.*),
            auth.uid(), user_email
        );

        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
