# Demo (`xx`) sandbox data

- `scripts/demo/baseline/index.ts` — **single source of truth** for demo rows,
  typed against the schema (`Database[...][...]['Insert']`, with only the
  `country_code` column widened to `'xx'`). Edit this file to evolve the demo;
  no migration needed unless the schema itself changes. Type-check with:
  `npx tsc --noEmit -p apps/picsa-server/tsconfig.json`.
  - `scripts/demo/baseline/climate_station_data.ts` — frozen climate summaries
    (GENERATED from seed snapshots, sliced + relabeled DEMO). Regenerate from
    `supabase/data/climate_station_data_rows.csv` if the seed changes; covered
    by the same type-check.
- `storage/xx/` — mirrors the `xx` bucket layout consumed by `db-seed`
  (local full seed) and `demo:reset` (both targets):
  - `baseline/` — immutable seed files, FK-referenced by baseline rows.
    Never wiped by reset.
  - `uploads/` — workshop scratch. Wiped on every reset.
