# Climate Data & Charting Roadmap

## 1. Shared Foundation: Issue #685

- [x] **Core Climate Models & 3-Month Periods**: Define `IThreeMonthPeriod`, `IMonthlyStationData`, and `IStationCapabilities`; add standard 3-month periods and dynamic period labels in `chart_definitions`.

## 2. Epic: Climate Data Sync, Audit & Administration

Related issues: #688, #691

- [x] **Clean & Ingest Production Monthly Data (Zambia)**: Successfully mapped 5 stations (`chipata_met`, `lundazi_met`, `mfuwe_met`, `msekera_agromet`, `petauke_met`), transformed 20,988 raw records into canonical wide monthly CSVs with 6 temperature metrics.
- [x] **Run CLI Audit (Zambia)**: Executed `sync-climate-data.ts --no-pull --country=zm`, generating final SHA-256 hashes, updated capabilities with `monthly: ['temp_min', 'temp_max']`, and verified 0 regressions.
- [x] **Ingest Remaining Production Monthly Data (Malawi, Zimbabwe)**: Ingest other country datasets as they become available.
- [ ] **Audit Legacy `override_data`**: Check and clean up `override_data` references in the climate tool (legacy override mechanism that is no longer needed with the typed capabilities architecture).
- [ ] **Sync Date Visibility**: Display clear indicators in the dashboard UI showing the exact date of data currently synced/bundled in the app per station and per country (`lastUpdated: YYYY-MM-DD`).
- [ ] **Visual Difference Preview**: Provide an interactive per-station, per-chart comparison tool in the admin panel previewing existing vs newly synced time-series curves/points (highlighting revised observations, newly added months, or missingness regressions) prior to approving and committing syncs.
- [ ] **Admin Supabase Endpoints**: Backend trigger / edge function endpoints for on-demand sync and station health checks.

## 3. Epic: Monthly & 3-Month Climate Charting & Analytics

Related issues: #689, #690

### Completed: Issue #689 — Climate Tool Timespan Display

- [x] **Capability Guard**: Automatically hide the timespan display if `station.capabilities?.monthly` is undefined or does not include the active chart ID (e.g. non-seasonal charts, or rain charts on stations with only monthly temperatures). Auto-revert timespan mode to `'annual'` when navigating between charts with differing capabilities.
- [x] **TimespanSelectorComponent & PeriodNavigatorComponent**:
  - Primary resolution selector in the sidebar (`[ Annual | 1-Month | 3-Month ]`) with sub-chips for 12 months or country 3-month periods.
  - Compact navigator in the chart area (`‹ [Period Label] ›`) to cycle periods without sidebar clutter.
- [x] **Lazy Loading & In-Memory Cache**: `ClimateDataService.getMonthlyStationData()` lazy-loads `[station_id].monthly.csv` on-demand and caches in memory.
- [x] **Client-Side 3-Month Aggregation Engine**:
  - `libs/utils/climate.utils.ts`: `filterMonthlyDataByMonth()` and `aggregateThreeMonthSeries()`.
  - Rainfall: Strict sum across 3 consecutive months with strict null propagation if any month is missing/null.
  - Temperatures: Extreme min (`min_tmin`), extreme max (`max_tmax`), and means (`mean_tmin`, `mean_tmax`).
- [x] **Dynamic Chart Titles & Sub-Definitions**: Dynamic period label appended to chart title, methodology descriptions updated via `getChartDefinitionText(chartDef, timespan)`.
- [x] **Comprehensive Test Suites**: 100% passing tests across `libs/utils`, `libs/data`, and `climate-tool` components and services (11 test suites, 27 tests in climate-tool).

### Completed: Issue #690 — Chart Tools Reactivity

- [x] **Dynamic Terciles**: Recompute 33rd / 66th percentiles dynamically against the active timespan series using reactive computed signals.
- [x] **El Niño / La Niña Reactivity**: Update point overlays and legend counts (`activeCount`) based on active timespan values across resolutions.
- [x] **Export Alignment**: Ensure print layout and PNG export titles display the active period (e.g. "Dec–Feb (DJF) Rainfall") and period-specific definitions via `chartDefinitionText`.

## 4. Demo (`xx`) Sandbox — Follow-ups

Related: `test`→`demo` replacement, generic storage write policies (`20261115000000_demo_xx_country.sql`), `picsa-server:demo:reset` (typed TS baseline in `scripts/demo/`, chained into `db:seed` + `db:seed:extended`, confirm only for `--remote`). AGENTS.md now forbids `supabase db reset` during verification work.

- [x] **Server sandbox**: `xx` enum/bucket (+ generic write policies via `storage_country_can_write` helper — insert requires ownership, global excluded), `demo` deployment (config `{}`), frozen `xx` station summaries, forecast row stamped with reset-month `YYYYMM` id + global sample PDF (auto-uploaded if missing, never overwritten), 2 demo `xx_qaa` placeholder translations on shared rows, storage baseline/uploads split, `user_roles` insert-only. Verified end-to-end locally.
- [ ] **Prod demo seed**: structure is live; first `--remote` run stopped at the `resource_files.owner` FK (local-only seed UUID — now fixed to null, admins-only). Safe to re-run: demo:reset is idempotent and picks up where it stopped.
- [x] **No dashboard country guards**: refresh buttons will 422 for `xx` (upstream only knows mw/zm/zw) — accepted deliberately. Do NOT add a supported/unsupported two-tier system; wire up a backend `xx` country later if live demo refresh is ever needed.
- [x] **CSV seed pipeline owns geo/test rows** — converged via `db:seed:export` after the prod migration (PR #899: `test` deployment/roles dropped, XX→Demo, en-XX + ny-XX locales, `xx_ny` column, plus prod content drift — later replaced by the `xx_qaa` placeholder language, migration `20261117000000`). Exception: `user_roles_rows.csv` is _not_ export-managed (verified absent from seed config), so its 2 stale `test` rows were removed by hand — otherwise every future `db:seed` would hard-fail on the deployments FK. pgTAP asserts infra only.
- [x] **Demo placeholder language `xx_qaa`** (replaces the retired `xx_ny` second-Chichewa experiment): `translations.xx_qaa` column + `qaa`/XX geo locale (ISO private-use range, never collides), `gen-types` now includes `xx`, `LOCALES_DATA` gains `xx_en`/`xx_qaa` (picker-hidden like `tj` until the frontend swap). Placeholder copy lives on _shared_ rows via `translation_seeds` (2 self-explanatory rows, no xx duplicates); reset clears `xx_qaa` back to NULL. Dashboard translations page needs no changes.
- [ ] **Dashboard reset button**: small `dashboard/demo/reset` edge function (service_role) calling the same baseline + storage wipe, so facilitators can reset without an operator. Script remains the fallback.
- [ ] **Frontend `global`→demo swap** (partly done: types + locale plumbing above): still to do — unhide `xx` in country picker, `demo` deployment entry, `xx` resource bundles, bundled `xx` climate summaries + geo topojson, map boundary handling. Open decisions: remove vs keep a `global` picker entry and the hardcoded `global` fallbacks (provider, config-select HACK, climate/forecast `global` branches); stored-settings migration for existing installs; demo budget currency (`$` vs `MK`); leave the inert `TJ`/`ZZ` seed rows (`countries_rows.csv`) alone — removing enum values is a separate migration with its own risk.
- [x] **Docs**: `deployment/01-new-country` (enum, bucket+policies, generic write-policy rule, demo example), `server/database` (`demo:reset`), `server/setup` (`test` retired). Open decisions: storage subsection on security page; possible dashboard-deployments page.
