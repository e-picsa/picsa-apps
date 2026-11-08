-- Disable audit trigger for climate_station_data and purge legacy audit rows.
--
-- Context: audit.audit_log on remote is ~509MB / ~3k rows (~167KB avg), dominated
-- by public.climate_station_data UPDATE snapshots (1234 rows x ~421KB avg).
-- The trigger was enabled in 20250906190000_climate_data_audit.sql (excluding only updated_at).
-- Climate data partners now maintain their own DB and histories, so auditing every
-- local update is unnecessary.
--
-- WARNING: Destructive and irreversible. Do NOT merge/apply without a confirmed
-- fresh full backup (see backup-db-full script, PR #857).
-- Other audited tables (resource_*, translations) are intentionally preserved.
-- Storage reclaim (VACUUM) should be handled out-of-band after apply if needed,
-- as VACUUM cannot run inside a migration transaction.

SELECT audit.disable_table_audit(
    'public',               -- schema
    'climate_station_data'  -- table
);

DELETE FROM audit.audit_log
WHERE schema_name = 'public'
  AND table_name = 'climate_station_data';
