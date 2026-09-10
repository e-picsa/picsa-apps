# Climate Data Retrofit & Roadmap

- [x] **Clean & Ingest Production Monthly Data (Zambia)**: Successfully mapped 5 stations (`chipata_met`, `lundazi_met`, `mfuwe_met`, `msekera_agromet`, `petauke_met`), transformed 20,988 raw records into canonical wide monthly CSVs with 6 temperature metrics.
- [x] **Run CLI Audit (Zambia)**: Executed `sync-climate-data.ts --compute-existing --country=zm`, generating final SHA-256 hashes, updated capabilities with `monthly: ['temp_min', 'temp_max']`, and verified 0 regressions.
- [x] **Ingest Remaining Production Monthly Data (Malawi, Zimbabwe)**: Ingest other country datasets as they become available.
- [ ] **Audit Legacy `override_data`**: Check and clean up `override_data` references in the climate tool (legacy override mechanism that is no longer needed with the typed capabilities architecture).

## 2. Completed Feature: Issue #689 (Climate Tool Timespan Display)

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

## 3. Analytical Tool Reactivity: Issue #690

- [ ] **Dynamic Terciles**: Recompute 33rd / 66th percentiles dynamically against the active timespan series.
- [ ] **El Niño / La Niña Reactivity**: Update point overlays and legend counts based on active timespan values.
- [ ] **Sample Size Guardrail**: Display warning banner when active series has < 20 years of valid observations.
- [ ] **Export Alignment**: Ensure print layout and PNG export titles display the active period (e.g. "Dec–Feb (DJF) Rainfall").

## 4. Dashboard Climate Admin: Issue #691

- [ ] **Sync Date Visibility**: Display clear indicators in the dashboard UI showing the exact date of data currently synced/bundled in the app per station and per country (`lastUpdated: YYYY-MM-DD`).
- [ ] **Visual Difference Preview**: Provide an interactive per-station, per-chart comparison tool in the admin panel previewing existing vs newly synced time-series curves/points (highlighting revised observations, newly added months, or missingness regressions) prior to approving and committing syncs.
- [ ] **Admin Supabase Endpoints**: Backend trigger / edge function endpoints for on-demand sync and station health checks.
