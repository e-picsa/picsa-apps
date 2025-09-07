# TODO

- [ ] Check if select statement works to setup trigger with args
- [ ] See if can update audit columns after setup

# Audit Migrations

This folder contains SQL migrations that set up a generic auditing system
for PostgreSQL (compatible with Supabase).

## Files

- **audit_schema.sql**  
  Creates the `audit` schema, the `audit_log` table, and supporting indexes.

- **audit_functions.sql**  
  Defines core trigger functions:

  - `audit.prevent_noop_update` – cancels updates if no meaningful data changed
  - `audit.jsonb_recursive_diff` – computes recursive JSONB diffs
  - `audit.audit_with_diff` – main trigger function to log INSERT/UPDATE/DELETE

- **audit_utils.sql**  
  Utility functions for managing audit:
  - `audit.enable_table_audit(schema, table, pk_column, excluded_columns[])`
  - `audit.disable_table_audit(schema, table)`
  - `audit.get_record_history(schema, table, pk_value, limit)`
  - `audit.cleanup_old_records(retention_days)`

## Usage

To enable auditing on a table:

```sql
SELECT audit.enable_table_audit(
  'public',          -- schema
  'climate_station', -- table
  'station_id',      -- primary key column
  ARRAY['updated_at'] -- excluded columns
);
```

To remove auditing:

```sql
SELECT audit.disable_table_audit('public', 'climate_station');
```

To view history for a record:

```sql
SELECT *
FROM audit.get_record_history('public', 'climate_station', '123');
```

To clean up old records (default 365 days):

```sql
SELECT audit.cleanup_old_records(180);
```

---

## Notes

- All functions are idempotent (`CREATE OR REPLACE`).
- Triggers are dropped/recreated by `enable_table_audit` to avoid duplicates.
- `audit.audit_log` stores diffs in `diff_added` and `diff_removed` for updates.
- Works with Supabase `auth.uid()` and JWT claims for user tracking.
