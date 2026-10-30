-- Retire 2025-26 seasonal/downscaled forecasts by nulling storage_file (tombstone).
--
-- Retired rows are hidden everywhere without schema changes:
--   - client/server forecast queries all filter storage_file IS NOT NULL
--   - ForecastService reconciles tombstones to purge matching local RxDB docs
--     (including downloaded attachments) on the next successful sync
--   - dashboard admin table keeps listing tombstoned rows as a retired record
--
-- IDEMPOTENT: the storage_file IS NOT NULL guard means re-runs match 0 rows,
-- and the statement is a no-op on fresh DBs. WHERE clause satisfies safeupdate.
--
-- Row identification covers all three id conventions in use:
--   - mw:        id '2025/...', storage '.../2025/...'
--   - zm/zw downscaled: id '%2025-26%', storage '.../2025-26/...'
--   - zm seasonal (bare uuid id): season only present in storage_file/label
-- NOTE: keep supabase/data/forecasts_rows.csv in sync (2025 rows removed) as
-- db:seed empties and upserts the table, which would otherwise resurrect these rows.

update public.forecasts
set storage_file = null
where forecast_type in ('seasonal', 'downscaled')
  and storage_file is not null
  and (
    id like '2025/%'
    or id like '%2025-26%'
    or storage_file like '%/2025/%'
    or storage_file like '%2025-26%'
  );
