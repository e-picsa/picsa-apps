# AI Generated Knowledge & Repository Gotchas

This file is a shared, curated knowledge base of non-obvious engineering gotchas, runtime traps, and architectural constraints discovered across AI agent sessions on this codebase.

> [!IMPORTANT]
> **Instructions for Agents**:
>
> 1. **Read this file** before starting work on backend triggers, bundling, charts, reactive state, or domain forecasting.
> 2. **Maintain by Topic, Not Timeline**: Do NOT append chronological logs (`Date / Context / Learning`). Instead, add or refine entries within the relevant category section below.
> 3. **High Signal Only**: Only add counter-intuitive gotchas, bundler/runtime traps, or domain quirks that an agent cannot easily deduce without failing first. Do not add general advice or commit changelogs.
> 4. **Prune When Obsolete**: If a refactor renders a workaround obsolete, delete or update the corresponding section.

---

## 1. Local Environment & Test Credentials

- **Admin Testing**: `admin@picsa.app` / `admin@picsa.app`
- **Non-Admin Testing**: `user@picsa.app` / `user@picsa.app`
- **Local Supabase Inbucket (Mailpit)**: Web interface runs at `http://localhost:54324/`. Internal Docker SMTP runs on port `1025` (`host: 'inbucket'`).

---

## 2. Multi-Runtime & Bundler Boundaries (Node, Deno, Angular)

### Pure TypeScript Domain Models (`libs/models`)

- `libs/models` must contain **only pure TypeScript interfaces and types** with zero runtime code.
- Any external library types (such as `c3.ChartConfiguration`) must strictly use `import type * as c3 from 'c3'` so the import is completely erased during compilation and never evaluated by Node or Deno.
- Files reside directly in `libs/models/` (flat structure without a redundant `src/` directory), matching `libs/utils/`.

### Dependency Isolation in `libs/utils`

- Deno edge functions and standalone Node scripts fail if `@picsa/utils` re-exports heavy root dependencies (e.g. Angular router/core, rxdb, xlsx, xml).
- Keep platform-agnostic, dependency-free utilities (`climate.utils.ts`, `object.utils.ts`, `async.utils.ts`) isolated so they rely only on native JavaScript/Web APIs (`Math`, `Array`, `Map`, `crypto.subtle`) and can be safely imported anywhere.

### Leaflet Plugins and ES Module Namespace Wrapper in Production

- **Problem**: Importing Leaflet using a namespace import (`import * as L from 'leaflet'`) results in a sealed ES module namespace wrapper object in production esbuild chunks. Leaflet plugins (like `@maplibre/maplibre-gl-leaflet`) dynamically attach methods to Leaflet's runtime export object via CommonJS/UMD, causing runtime crashes (`typeError: Ai.maplibreGL is not a function`).
- **Solution**: Import Leaflet as a default export: `import L from 'leaflet'` with `esModuleInterop: true`. This resolves directly to the mutable Leaflet exports object shared by plugins.

### Edge Function Resource Bundling (`static_files`)

- The Deno bundler (esbuild) statically analyzes `.ts` imports and completely strips out non-TS files (such as `.html`, `.json`) unless declared as static files.
- To include arbitrary files for use with `Deno.readTextFile()`, declare them in `supabase/config.toml` under the function block:
  ```toml
  [functions.dashboard]
  static_files = [ "./functions/dashboard/**/*.html" ]
  ```

### Heavy Document Export Isolation (DOCX/PDF)

- Client-side export libraries (e.g., `docx`, `downloadjs`) must be imported strictly within dashboard module services (`apps/picsa-apps/dashboard/src/app/modules/.../services/`). Never import them into shared libraries (`libs/`) to prevent bloat in the mobile Capacitor app bundle.
- In `docx` table generation, vertically merged cells spanning multiple columns in row 1 must maintain `columnSpan: N` and `verticalMerge: VerticalMergeType.CONTINUE` in subsequent rows so OpenXML table grids align properly.

### TSX tsconfig-paths Resolution in Monorepos

- When executing standalone TypeScript scripts using `node ./node_modules/tsx/dist/cli.mjs` from the repository root, pass `--tsconfig tsconfig.base.json` so that path aliases defined in the base configuration (`@picsa/models`, `@picsa/utils`) resolve correctly at runtime.

### Unit Test Colocation Convention

- **Strict Colocation Next to Source**: Unit test specifications (`*.spec.ts`) must always be colocated directly next to the source file they test (e.g. `libs/utils/climate.utils.spec.ts` next to `libs/utils/climate.utils.ts`, and `libs/data/climate/chart_definitions/periods.spec.ts` next to `periods.ts`).
- Avoid scattering library or utility tests into consumer application folders (such as `apps/picsa-tools/climate-tool/src/app/data/`). Libraries (`libs/utils`, `libs/data`) maintain their own Nx project/Jest targets (`yarn nx test utils`, `yarn nx test data`), keeping tests discovered cleanly without jumping across the monorepo.

### TypeScript Strictness & SonarCloud Rules (S2871, Number Parsing, Duplication)

- **Deterministic Array Sorting (S2871)**: Never use bare `Array.prototype.sort()` or `toSorted()` on string arrays or object keys. Always supply an explicit comparator `(a, b) => a.localeCompare(b)` to avoid locale-dependent sorting anomalies.
- **Strict Number Checks & Parsing**: Always use `Number.isNaN()` and `Number.parseInt(..., 10)` rather than global `isNaN()` and `parseInt()`. The global variants perform loose implicit type coercions (e.g. `isNaN(undefined) === true`, `isNaN(null) === false`), whereas `Number.*` methods operate strictly on numbers.
- **SonarCloud Duplication Prevention (Dictionaries & Grade Records)**: Defining repetitive structural configurations (e.g. grade settings, thresholds, hex colors, and size properties) across multiple constants can trigger Sonar's block duplication detector. Separate styling and definitions into modular JSON/object literals (`EL_NINO_STYLES`, `EL_NINO_DEFINITIONS`) and compose them using object spread syntax. This preserves crystal-clear JSON readability for reviewers while preventing large multi-line object block duplication (≥ 10 lines) in SonarCloud.

---

## 3. Supabase, Edge Functions & Database Triggers

### Supabase Environment Detection & Local Email Routing

- In Supabase Edge Functions, detect local Docker development by checking if `Deno.env.get('SUPABASE_URL')?.includes('kong')` or if production keys (`RESEND_API_KEY`) are missing.
- In local development, route emails to Inbucket using `npm:nodemailer` pointed to `host: 'inbucket', port: 1025, ignoreTLS: true` dilemmas.

### Database Triggers & Internal Edge Functions

- **Avoid Synchronous External Calls**: UI interactions should not hit external APIs or send emails synchronously. Use `AFTER INSERT/UPDATE` database triggers to invoke background tasks.
- **Preferred Trigger Method**: Always use `public.call_edge_function(name, body)` wrapped in a PL/pgSQL trigger function rather than `supabase_functions.http_request`.
  - `public.call_edge_function` dynamically retrieves `project_url` and `anon_key` from `private.get_secret(...)`, keeping migrations portable across environments.
  - In contrast, `supabase_functions.http_request` requires hardcoding URLs (e.g., `http://172.17.0.1:54321/...`), which breaks across local, staging, and production environments.
- **Deterministic Local Anon Key**: The Supabase CLI local `anon_key` is deterministic. It is seeded into `vault.decrypted_secrets` via `supabase/seed.sql` (`select vault.create_secret('eyJhb...', 'anon_key', 'supabase local anon key');`) so trigger calls authenticate locally out-of-the-box without missing authorization header errors.

### PostgreSQL Generated Column Nullability

- When adding or re-creating a `GENERATED ALWAYS AS (...) STORED` column in SQL migrations, PostgreSQL treats the column as nullable by default unless `NOT NULL` is explicitly declared (`ADD COLUMN id text NOT NULL GENERATED ALWAYS AS (...) STORED`).
- Omitting `NOT NULL` causes Supabase CLI's TypeScript generator (`gen-types`) to emit `id: string | null` instead of `id: string`.

### Supabase Async Initialization & Offline Null Checks

- **Initialization Timing**: If a service inherits from `PicsaAsyncService`, `ready()` resolves immediately when `init()` finishes. Initializing the Supabase client or database property (`db`) inside an Angular `effect()` is asynchronous and runs on the next microtask cycle, meaning `ready()` can resolve while `db` is still undefined. Initialize clients synchronously inside `init()`.
- **Offline Mode**: When Supabase is offline (detected via health check), `isAvailable` is set to `false` and `db` is not created. Services interacting with Supabase (`AppUserService`, `PicsaDatabaseSyncService`, `ForecastService`) must check `isAvailable()` before executing operations on `supabaseService.db` to prevent unhandled `TypeError` crashes.

### Climate Station Identifiers & Seed Data (Canonical Slugs vs Met IDs)

- **Station Slug as Canonical Primary Key**: In `climate_stations`, the primary key is `(country_code, station_id)` where `station_id` is always a clean, human-readable slug (e.g. `masvingo`, `buhera`, `chipata_met`), not an opaque numeric ID. Downstream foreign keys (`crop_data_downscaled.station_id`, `climate_station_data.station_id`), routing, and generated CSV filenames (`<station_id>.csv`) depend on this slug.
- **National Met IDs**: Official national meteorological service or WMO station IDs (e.g. Zimbabwe MSD `67875010`) are stored in `met_station_id` (database column on `climate_stations` and `metStationId` on `IStationMeta`) for reference and linking. Avoid hardcoding station ID maps in code.
- **Seed CSV Line Endings (CRLF Trap)**: Database seed CSVs in `apps/picsa-server/supabase/data/` may have Windows-style CRLF (`\r\n`) line endings. When programmatically modifying or appending columns to these CSVs, always strip `\r` (split on `/\r?\n/`) and write with clean Unix LF (`\n`) endings; otherwise appending values to lines with unstripped `\r` results in the added token or comma rendering on a separate line.
- **Station Climate Data Availability & Filtering**: In `capabilities.generated.ts`, stations without data files have `years: []` (empty array) rather than omitting entries or adding redundant boolean flags. `hasStationClimateData(station)` checks `Boolean(station?.capabilities?.years?.length)` (along with chart types). In `ClimateDataService`, `allStations` provides all registered country stations while `stations` filters by `!station.draft && hasStationClimateData(station)` so frontend tools only present stations with local CSV summaries.

### User Role Authorization Architecture

- **Database**: Roles are stored in `user_roles` (deployment_id, user_id, roles[]).
- **JWT Claim**: `custom_access_token_hook` injects these roles into the JWT `picsa_roles` claim.
- **Client Authorization**:
  - Always check permissions using `DashboardAuthService.hasRole(role: AppRole)`.
  - Route protection uses the functional `authRoleGuard` in `dashboard/src/app/modules/auth/guards`.
  - Template protection uses `AuthRoleRequiredDirective` (`*authRoleRequired="..."`).

### User-Submitted Feedback & Storage Isolation

- **Deno lockfile version**: keep `apps/picsa-server/supabase/functions/deno.lock` at v4 (edge runtime Deno 2.1.4 compatible) — newer local Deno upgrades it to v5 and breaks `supabase functions serve`; restore it after local deno test runs.
- **Service-role-only tables & Private Buckets**: for user-submitted content (`feedback_reports`), REVOKE anon/authenticated + GRANT service_role with RLS and route all client access through edge functions; store screenshots in a private bucket (`feedback-screenshots`).
- **Edge Runtime Multipart Uploads**: `multiparser` npm package is broken on the edge runtime. Use native `req.formData()` with a manual byte-level fallback parser (`_shared/request.ts`), validate images via magic bytes (client-declared MIME is untrusted), and delete the uploaded object if row insert fails (orphan cleanup).
- **Zod Caps for Device Info**: when setting validation caps, accommodate real-world User-Agent strings (~150-200 chars) and use non-strict objects (`z.object`) to prevent dropping submissions from client builds with extended metadata.
- **Supabase Studio API Port in `config.toml`**: `[studio] api_url` must explicitly include the API port (`http://localhost:54321`). Omitting the port causes Supabase Studio's backend to rewrite signed URLs and client storage links to port 80 (`http://localhost/...`), resulting in `ERR_CONNECTION_REFUSED` on image previews in Studio.

---

## 4. Angular 21, Signals & Reactive Architecture

### Material CDK Overlays & OnPush Change Detection

- **Issue**: Angular Material components like `mat-select` render dropdown options in an overlay container (`cdk-overlay-pane`) at the document root, outside the component's DOM tree. Under `ChangeDetectionStrategy.OnPush`, selection events do not bubble through the component's DOM tree, leaving the UI stale.
- **Solution**: Use Angular 21 modern Signal Forms (`@angular/forms/signals`) rather than manual `ChangeDetectorRef` triggers:
  - Define a writable signal: `public readonly model = signal<T>(initialState);`
  - Define the form tree: `public readonly form = form(this.model, (path) => { ... });`
  - Bind inputs with `[formField]="form.field"` (importing `FormField` from `@angular/forms/signals`).
  - Reading `model().field` in the template automatically registers the signal dependency and triggers change detection on view updates regardless of DOM hierarchy.

### Synchronous Effects vs Async Operations

- Avoid writing async effects like `effect(async () => { await this.ready(); ... })`.
- Angular tracks signal dependencies synchronously. Any signal accessed after the first `await` is not tracked. Concurrent async executions can also introduce race conditions.
- Trigger service initialization in the constructor and react synchronously to `this.readySignal()` in effects, delegating async tasks to methods with cancellation tokens.
- **Catch Promise Rejections in Effects**: Any async promise triggered from an `effect()` (such as calling translation services or data fetches) must have explicit `.catch(...)` error handling. Uncaught rejections in effects bubble outside Angular's error handling into the Node process, causing `ERR_UNHANDLED_REJECTION` crashes during Jest test runs.

### Internationalization (i18n) Module Import in Standalone Components

- Never import `TranslatePipe` or `TranslateModule` directly from `@ngx-translate/core`.
- The correct pattern for this monorepo is to import `PicsaTranslateModule` (or `PicsaTranslateModule.forRoot()` in specs) from `@picsa/i18n` into the `imports` array of standalone components and tests.

### Angular Component SCSS Budgets & Scoped Selector Expansion

- **Avoid Deep SCSS Nesting**: Deep nesting in component `.scss` files (`.parent { .child { .subchild { ... } } }`) explodes compiled CSS bundle sizes because Angular's `ViewEncapsulation.Emulated` attaches host-scoped attribute selectors (`[_ngcontent-...]`) to every individual element selector in the chain. For example, a 700-line deeply nested SCSS file compiles to >15 kB, exceeding Angular's standard 4 kB production component style budget (`anyComponentStyle`).
- **Tailwind First**: Follow project convention #7 by applying Tailwind utility classes directly in templates for layout, flexbox/grid, spacing, typography, and badges. Reserve component `.scss` exclusively for styles requiring pseudo-elements, complex coordinate positioning (like table `position: sticky`), or dynamic data-attribute color maps. Refactoring deeply nested SCSS to Tailwind can reduce stylesheet size by over 90% (e.g. from 15.1 kB down to 1.5 kB), keeping components comfortably within default budget limits without needing budget overrides in `project.json`.

---

## 5. Charts & SVG Visualizations (C3 / D3)

### C3 Inline Style Precedence & Point Customization

- C3 default stylesheets apply `.c3-circle { fill: currentColor !important }`.
- When rendering custom SVG point shapes (`<polygon>`, `<rect>`, `<circle>`), apply inline styles with `!important` (e.g. `style="fill: ${color} !important; stroke: ${strokeColor} !important;"`) to prevent styles from reverting to black.
- When replacing SVG circle nodes with non-circle tags, C3's built-in D3 resize handler cannot update `cx`/`cy`. Use C3's internal scale functions (`chartApi.x(d.x)` and `chartApi.getYValue(d)`) inside a `@HostListener('window:resize')` handler to maintain accurate pixel positioning on resize.

### SVG Serialization for Canvas/PNG Export

- When serializing an SVG to render onto an HTML5 Canvas via `new Image()`, copying all `window.getComputedStyle(element)` properties onto element attributes copies C3 stylesheet rules (`.c3 path { fill: none; stroke: #000; }`) onto custom overlay elements, overriding fills and breaking custom graphics.
- Filter computed styles to essential presentation properties (`fill`, `stroke`, `opacity`, `font-*`) and explicitly exclude custom overlay groups (`.picsa-point-overlay`, `.picsa-legend-overlay`) so explicit XML attributes and inline styles are preserved.

### C3 Callback Lifecycle Timing

- `c3.generate()` invokes `config.onrendered` synchronously before returning the new chart instance.
- Any wrapper component managing C3 lifecycle must ensure `onrendered` fires with the chart instance reference fully assigned to prevent downstream consumers from seeing `undefined`.

### Signal Reactivity for SVG Point Overlays & Render Events

- **Signal Delegation**: When a central service (`ClimateChartService`) maintains an `effect()` that calls an active tool handler (`activeToolHandler().getPointStyle(d)`), Angular automatically tracks signals read inside that delegate (e.g. `LineToolComponent.value()`). Modifying the child signal re-triggers the parent effect without RxJS Subjects.
- **Render Notifications**: Replace `Subject<void>` for chart render events with a `chartRenderCount = signal(0)` counter. Export pipelines can await render completion using a promise helper queue without subscription leak risks.

### Declarative Chart Tool Configuration

- Chart tools must not be conditionally hardcoded inside UI components (e.g. `if (_id === 'temp_min')`).
- Declare tool availability in chart definitions (`libs/data/climate/chart_definitions`). Define a base `DEFAULT_TOOLS` object with `enabled: true` and merge overrides using `merge(DEFAULT_TOOLS, { [toolName]: { enabled: false } })`.

### Declarative Timespan Range Configuration (`timespanRange`)

- Avoid hardcoding chart ID checks in components or services (`if (id === 'temp_min' || id === 'temp_max')`).
- Declare timespan range policy directly in chart definitions (`IChartMeta.timespanRange: 'full' | 'seasonal'`).
- Temperature charts (`temp_min`, `temp_max`) declare `timespanRange: 'full'` to expose all 12 calendar months (`1..12`) and 12 running climatological 3-month periods (`DJF..NDJ`).
- Seasonal charts (e.g. `rainfall`) default to `'seasonal'`, filtering to the country's active agricultural season (`Oct..Jun` / `OND..FMA`). Helpers `getMonthsForChart` and `getPeriodsForChart` derive available selections declaratively.

### Responsive Tool Customization Slots & Sidenav Container Layout

- **Sidebar Customization vs Bottom Clutter**: Deep tool customization controls (such as the ENSO grade filter chips) should reside in the sidebar/drawer options panel (`climate-chart-options`) rather than stacked below the fixed-height chart in `chart-layout`. On mobile viewports, controls below the chart are hidden offscreen, whereas the drawer ensures immediate accessibility.\n- **Single Scroll Container & Preventing Layout Shifts**: Never declare `overflow-y: auto; height: 100%` inside child components placed within `mat-sidenav` / `picsa-sidenav-layout`. The outer sidenav inner container already provides vertical scrolling. Adding an inner scroll creates a double scrollbar and robs horizontal width (~16px), causing flex containers to wrap onto new lines.
- **Chart Card Grid Dimensions**: In `view-select`, chart cards maintain their standard dimensions (`max-width: 80px; width: 100%;` with `50px` icon images and `flex-wrap: wrap; gap: 8px`), neatly laying out cards in rows of 3 without horizontal compression or truncation.
- **Inline Drawer Tool Headers & Dedicated Section Headings**: When a tool's detailed customization replaces the tool selection list, place the back button inline with the active tool's title (`.tools-header.has-active-tool`) rather than stacking a separate action row. Section headers (`Chart`, `Tools`, `Share`) provide clean visual hierarchy, pairing with focused actions like `Share Image`.
- **Handler Singleton Registration**: `BaseChartToolComponent` registers itself as `chartService.activeToolHandler` on construction and clears it on destroy. Therefore, tool components must never have duplicate template declarations. Moving a tool to `climate-chart-options` requires removing it from `chart-layout`.
- **Slot Dismissal**: Dismissing the customization slot via `toolService.disableAll()` resets `activeTool`, clearing SVG chart point/line overlays and SVG canvas legends, and gracefully restoring the tool selection view.

### Unified Y-Value Formatting Across Chart Tools

- Expose a central `formatYValue(value: number, meta?: IChartMeta, isAxisLabel?: boolean)` in `chart.utils.ts` and delegate through `ClimateChartService.formatYValue` and `BaseChartToolComponent.formatYValue`. This ensures date thresholds (e.g. `'date-from-July'`) and numeric values format consistently across all chart tools.

---

## 6. Domain Logic & Agronomy Data Rules

### Climatological Season Alignment (July 1st Start)

- In Southern Africa (Zambia, Malawi, Zimbabwe), meteorological data systems align the agricultural season from July 1st to June 30th (e.g. season year 2024 spans July 2024 to June 2025).
- Month membership in seasons crossing the calendar year boundary (e.g., `DJF` = Dec, Jan, Feb) belongs directly to that attributed season start year without requiring ad-hoc day-shifting in the frontend.

### Station Availability & Capability Indexing

- Rather than downloading and parsing CSV files on the mobile client to discover available charts, stations are indexed with `IStationCapabilities` (schemaVersion, lastUpdated, contentHash, metric availability). This enables instant, synchronous chart availability filtering and cache invalidation.

### Climate Data Sync, Formatting & Audit Pipeline

- **Deterministic CSV Formatting**: For rain-only meteorological stations, omitting temperature columns altogether (`month,Rainfall` vs `month,Rainfall,min_tmin,mean_tmin,mean_tmax,max_tmax`) cuts file size by >60%. Floats are rounded to 1 decimal place to eliminate sensor noise and float representation drift.
- **Idempotent CLI Runner**: The CLI runner (`apps/picsa-scripts/src/climate/sync-climate-data.ts`) computes SHA-256 hashes of canonical station data. Preserving `lastUpdated` when data hashes match ensures zero git diffs on subsequent runs.
- **Per-Country Station Organization**: Grouping stations by country (`data/stations/<country>/`) with separate `metadata.ts` and `capabilities.generated.ts` cleanly isolates PRs and prevents cross-country merge conflicts.
- **Symmetric Capability Models**: Modeling `monthly?: IChartId[]` as a string array symmetrically matches `annual?: IChartId[]`, simplifying runtime availability checks (`station.capabilities?.[timespan]?.includes(chartId)`).
- **Missing Years Normalization**: In legacy data files (e.g. Zimbabwe Climsoft exports), `0` placeholders in season columns (`Start=0, End=0, Length=0, Rainfall=0`) must be normalized to `null` to accurately count missing years in $[Y_{\min}, Y_{\max}]$.
- **Within-Batch Duplicate Observation Handling**: Upstream sync feeds can emit multiple records for the same station, month, and metric (e.g. overlapping time slices or correction batches). `pivotLongToWideMonthly` tracks duplicates via `IPivotOptions.onDuplicate`. Identical duplicates are de-duplicated cleanly, while conflicting values (`existing !== incoming`) log warnings and are captured as `DUPLICATE_OBSERVATION_CONFLICT` violations in the audit report.
- **Git Commit Date Retrieval & Timestamp Idempotency**: Station `lastUpdated` uses a clean `YYYY-MM-DD` date derived from `git log -1 --format="%as"` over the station's CSV files. When `contentHash` is unchanged across subsequent runs, the existing `lastUpdated` is strictly preserved, guaranteeing 100% idempotency (zero git diffs).

### RONI ENSO Season Classification & Grade Definitions

- **RONI Event Criteria**: A season is classified as El Niño (or La Niña) when the running 3-month mean SST anomaly equals or exceeds $+0.5^\circ\text{C}$ (or $\le -0.5^\circ\text{C}$) for at least 5 consecutive overlapping 3-month periods. For example, 1953-1954 has 5 consecutive periods $\ge +0.5^\circ\text{C}$ (JJA to OND) and is classified as Weak El Niño (`WE`, grade 1), preserving historical continuity in `EL_NINO_YEARS`.
- **Season Continuity**: The RONI dataset maintains continuous season records through the station data projection range (e.g. 2026-2027) so charts with recent or projected years have well-defined records rather than missing keys.

### Climate Tool Trendline Analytics & Presentation Rules

- **Display Rule & Cutoff**:
  - A trendline is plotted **only** when statistically clear ($p < 0.05$). It is rendered as a **solid coloured line** in the series color (`strokeWidth = 2.5`).
  - When $p \ge 0.05$ (inconclusive / no clear trend) or data is insufficient, **no line is plotted** to avoid visually asserting an unconfirmed directional trajectory. Grey dashed lines are strictly prohibited on public graphs.
- **4 Explicit Outcome Categories**:
  1. `upward_trend`: $p < 0.05$ and slope $> 0$.
  2. `downward_trend`: $p < 0.05$ and slope $< 0$.
  3. `no_clear_trend`: $p \ge 0.05$ (inconclusive).
  4. `insufficient_data`: fails sample size ($n < 20$) or completeness ratio ($< 70\%$).
- **Public Views**: Only **30-year view** (multidecadal normal) and **Full-record view** ($\ge 20$ usable years, $\ge 70\%$ completeness) are supported. 10-year view is removed from climate trend classification.
- **Precision & Rounding**:
  - Round all decadal rates of change and confidence intervals to the **nearest integer** (e.g. `+14 mm / decade`, `95% CI: [+3, +25] mm / decade`).
  - Exception: Temperature (`°C`) is formatted to **1 decimal place** (e.g. `+0.4 °C / decade`, `95% CI: [+0.1, +0.7] °C / decade`).
- **Goodness-of-Fit ($R^2$) Role**:
  - $R^2$ is provided purely as a descriptive measure of variance explained in the collapsible statistics panel.
  - In highly variable climate series (e.g. rainfall), low $R^2$ is common even when an important trend exists. $R^2$ is never used as an arbitrary gating threshold or styled as "failing".
- **Monthly Timespan Exclusion**: Trendline tools are strictly scoped to annual and seasonal indicators, hiding on monthly views where unadjusted seasonality would distort linear fits.

### Angular Material Component Conventions

- **Angular Material v21 Button Syntax**: Always use modern attribute directives (`<button matButton>`, `<button matButton="filled">`, `<button matIconButton>`). Never use legacy tag/attribute forms like `mat-button`, `mat-icon-button`, or `mat-flat-button`.
