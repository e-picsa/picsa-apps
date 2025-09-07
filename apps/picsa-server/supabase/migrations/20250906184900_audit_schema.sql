-- Create table to store audit data
CREATE SCHEMA IF NOT EXISTS audit;

-- ============================================================
-- Main audit log table
-- ============================================================
CREATE TABLE IF NOT EXISTS audit.audit_log (
    id BIGSERIAL PRIMARY KEY,
    schema_name TEXT NOT NULL,           -- schema of the audited table
    table_name TEXT NOT NULL,            -- name of the audited table
    operation TEXT NOT NULL,             -- 'INSERT', 'UPDATE', 'DELETE'
    pk_value TEXT NOT NULL,              -- primary key value as string
    new_data JSONB,                      -- row data after change (NULL for DELETE)
    diff_added JSONB,                    -- JSONB keys/values added or changed (UPDATE only)
    diff_removed JSONB,                  -- JSONB keys/values removed or changed (UPDATE only)
    changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    changed_by UUID DEFAULT auth.uid(), -- Supabase user UUID
    changed_by_email TEXT                -- optional: Supabase user email
);

-- ============================================================
-- Indexes for audit_log
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_audit_log_table_pk 
ON audit.audit_log(schema_name, table_name, pk_value, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_table_time 
ON audit.audit_log(schema_name, table_name, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_user 
ON audit.audit_log(changed_by, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_operation 
ON audit.audit_log(operation, changed_at DESC);