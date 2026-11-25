# MW EPA import — review summary

One-shot consultant import: 28 xlsx sheets → **164 EPA blocks** → **133 EPA locations** (161 blocks mapped, 3 unmapped), **272 variety definitions**.
QC (ENFORCE_LOOKUP_BOUNDS): included=17263 excluded=235 skipped-locations=0.

## What to check (in order)

1. `consultant-feedback.md` — what we dropped, corrected, and need confirmed. **Send this to the consultants.**
2. `summary.md` — counts, decisions (this file).
3. `coverage.md` — unmapped blocks with EPA-by-coordinates evidence and verdicts; mapped EPA ids mirror the workbook col N.
4. `varieties.md` — flagged MULTI_DAYS / MULTI_MATURITY varieties, then the full per-variety ledger.
5. `inconsistencies.md` — why days disagree (template duplication, sheet drift, GAP deviations) and how that biases stored water.
6. `outliers.md` — raw water values outside Q1−3·IQR / Q3+3·IQR per crop, with source blocks.
7. `water.md` — conflict-driven water choices with dropped samples and kept values.
8. `stations.md` — far (>50 km) block↔station links; all should be explained.
9. `qc.md` — exclusion reasons; spot-check locations in the dashboard crop-qc admin views (acceptance gate).
10. `crops.md` — per-crop water ranges and maturity/day spreads.
11. `../sql/mw-epa-prod-upsert.sql` — the prod artifact (idempotent upserts).

## Pipeline decisions (encoded, not configurable)

- Water rounded to nearest 5 mm (dashboard prod convention); spreadsheet float artifacts removed.
- `water == 0`/blank rows skipped (perennial cassava/banana carry no seasonal requirement).
- Blank crops forward-filled within block; variety lists split with the shared extractor.
- Duplicate blocks: modal days win; >20% water spreads keep the nearest-EPA-station value (logged).
- Stations prefer climate-data-bearing siblings (e.g. `dedza_met` over `dedza`); coordinates break ties ≤100 km.
- Station names match exactly (no fuzzy lookup); verified homonyms resolve by coordinates (see STATION_NAME_OVERRIDES in station-mapping.ts).
- Mislabelled crop columns are reassigned from unambiguous variety markers (MW-scoped overrides); ambiguous single-variety rows stay as written and are flagged.
- Fill-down artifacts (one water value across most rows of a block), decimal-days formula errors, and banana rows carry no data and are skipped with consultant-facing logs.
- Slugs never invented: 3 blocks and 54 canonical EPAs have no data by design.

Regenerate everything: `yarn scripts picsa/crop-probability/mw-consultant/import-mw-epa-water-requirements`
Raw per-district JSON: `intermediates/blocks/` (+ typed `index.ts`). Full machine audit: `intermediates/mw-epa-audit.json`.
