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

- [x] **Server sandbox**: `xx` enum/bucket/policies, `demo` deployment (config `{}`, dashboard lists the 2 `xx` stations, no API fallback), frozen `xx` station summaries (generated slices of prod seed snapshots, relabeled DEMO), forecast row stamped with reset-month `YYYYMM` id + global sample file, 8 demo `xx_ny` translations (top-of-list budget strings, authentic Chichewa), storage baseline/uploads split, `user_roles` insert-only.
- [x] **No dashboard country guards**: refresh buttons will 422 for `xx` (upstream only knows mw/zm/zw) — accepted deliberately. Do NOT add a supported/unsupported two-tier system; wire up a backend `xx` country later if live demo refresh is ever needed. CSV seed pipeline owns geo/test rows — they converge via `db:seed:export` after the migration runs on prod; pgTAP asserts infra only.
- [x] **Demo locale `xx_ny`**: `translations.xx_ny` column + `ny`/XX geo locale (same demo migration, single file), `gen-types` now includes `xx` (legacy filter fixed), `LOCALES_DATA` gains `xx_en`/`xx_ny` (picker-hidden like `tj` until the frontend swap), `legacy-mapping` += `xx`, `CLIMATE_STATIONS_META`/`PROBABILITY_TABLE_DATA` += `xx: []`. Demo Chichewa lives on *shared* rows via `translation_seeds` (no xx duplicates — duplicates listed the same text twice); reset clears `xx_ny` back to NULL. Dashboard translations page needs no changes.
- [ ] **Dashboard reset button**: small `dashboard/demo/reset` edge function (service_role) calling the same baseline + storage wipe, so facilitators can reset without an operator. Script remains the fallback.
- [ ] **Frontend `global`→demo swap** (partly done: types + locale plumbing above): still to do — unhide `xx` in country picker, `demo` deployment entry, `xx` resource bundles, bundled `xx` climate summaries + geo topojson, map boundary handling.
- [x] **Docs**: `deployment/01-new-country` (enum, bucket+policies, generic write-policy rule, demo example), `server/database` (`demo:reset`), `server/setup` (`test` retired). Open decisions: storage subsection on security page; possible dashboard-deployments page.
