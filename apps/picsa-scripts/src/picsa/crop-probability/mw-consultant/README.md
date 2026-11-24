# MW Consultant EPA Import (one-shot)

Reads `input/` and rebuilds everything. No flags needed for the standard run;
`--upsert` also writes to the database.

```sh
# Full run: parse -> review/*.md -> sql/*.sql (no database writes)
yarn scripts picsa/crop-probability/mw-consultant/import-mw-epa-water-requirements

# Same, plus upsert crop_data + crop_data_downscaled (local Supabase by default)
yarn scripts picsa/crop-probability/mw-consultant/import-mw-epa-water-requirements --upsert
```

Maintainer-only: `--write-epa-column` backfills the workbook's `epa_canonical`
column from `epa-mapping.ts` (run once after editing the mapping).

## Layout

| Folder | Committed | Contents |
|--------|-----------|----------|
| `input/` | yes | Source: `mw-probabilities.xlsx` (col N `epa_canonical` carries the mapped EPA id per block), `mw-station-mapping.docx` |
| `intermediates/` | no | Raw machine JSON: per-district `blocks/*.json` + typed `index.ts`, full `mw-epa-audit.json` |
| `review/` | yes | Human-readable validation notes (`summary.md` first) |
| `sql/` | yes | One-time prod upload (`mw-epa-prod-upsert.sql`, idempotent) |

## Validation order

1. `review/consultant-feedback.md` — what we dropped, corrected, and need confirmed. **Send this to the consultants.**
2. `review/summary.md` — counts, decisions, what to check.
3. `review/coverage.md` — unmapped blocks with point-in-polygon verdicts (geo-data cross-check); mapped EPA ids mirror the workbook col N.
4. `review/varieties.md` — flagged MULTI_DAYS / MULTI_MATURITY varieties, then the full per-variety ledger.
5. `review/outliers.md` — raw water values outside Q1−3·IQR / Q3+3·IQR per crop, with source blocks.
6. `review/water.md`, `review/stations.md`, `review/qc.md`, `review/crops.md`, `review/geo-thread.md` (cross-thread record).

Type-check the generated splits:
`npx tsc --noEmit --resolveJsonModule --target es2020 --moduleResolution bundler --types node intermediates/blocks/index.ts`

## Follow-up (separate PR, after prod upload)

Apply `sql/mw-epa-prod-upsert.sql`, run `yarn scripts:crop:sync --country=mw` to
regenerate the EPA app tables, re-apply the geo `epa` layer flip, verify in app
and dashboard, then delete the superseded district rows.

Heads-up from the geo-data cross-check (`review/geo-thread.md`): the canonical
186 EPAs are 2013 vintage (2016 diary counts 203; e.g. Chiluwa EPA Salima is
missing). Orphans are coverage gaps — keep them. Post-2013 EPAs, when sourced
from DAES, should follow the `hasPolygon`/`mappedTo` 213-name registry pattern
(null geometry tolerated list-only); never promote station/section names to EPAs.
