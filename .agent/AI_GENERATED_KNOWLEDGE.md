# AI Generated Knowledge

This file is a shared knowledge base for AI agents operating on this codebase.

## Instructions for Agents

1.  **Read this file** at the start of your session to learn from previous agent experiences.
2.  **Append to this file** if you discover:
    - Specific "gotchas" or tricky implementation details.
    - Workarounds for recurring issues.
    - Patterns that work well for this specific architecture.
3.  **Format**: Use the following format for entries:

```markdown
### [Topic/Issue Name]

**Date**: YYYY-MM-DD
**Context**: [Brief context of the task]
**Learning**: [What you learned or the solution you found]
```

---

## Knowledge Base

### Local Development Credentials

**Date**: 2026-02-20
**Context**: Logging into the local server during automated tests.
**Learning**: Use `admin@picsa.app` with password `admin@picsa.app` for admin testing and `user@picsa.app` with password `user@picsa.app` for non-admin testing.

### Verification Entry

**Date**: 2026-02-06
**Context**: Verifying the new AI self-documentation workflow.
**Learning**: Agents can successfully append to this file to share knowledge.

### Supabase User Role Management Implementation

**Date**: 2026-02-08
**Context**: Implementing user role management UI and Backend functions in `user-permissions.component.ts`.
**Learning**:

1. **Database**: Roles are stored in `user_roles` table (deployment_id, user_id, roles[]).
2. **Auth Hook**: `custom_access_token_hook` injects these roles into JWT `picsa_roles` claim.
3. **Backend Logic**:
   - `add-user.ts` and `update-user-roles.ts` (new) handle role changes.
   - Validation ensures users cannot assign roles they do not possess.
   - `_shared/auth.ts` was updated to treat `deployments.admin` as a super-admin for the deployment, bypassing specific role checks.
4. **Frontend**:
   - `DashboardAuthService` computes available roles and handles implicit role inheritance using `@picsa/shared/utils/role.utils`.
   - `user-permissions.component.ts` uses `availableRoles` from `DashboardAuthService`.
   - `APP_ROLES` is now derived from the shared utility's exhaustive `APP_ROLES_MAP`.
   - `assignImplicitRoles` in both frontend and backend now uses the robust shared implementation that expands Global Admin/Author roles to all feature roles.

### Role-Based Route Protection

**Date**: 2026-02-10
**Context**: Implement route guards for the dashboard `climate -> admin` page.
**Learning**:

1.  **Auth Logic Encapsulation**: `DashboardAuthService` now has a `hasRole(role: AppRole)` method for checking permissions. This replaces ad-hoc logic in directives.
2.  **Route Guard**: `authRoleGuard` is a functional guard in `dashboard/src/app/modules/auth/guards` that uses `DashboardAuthService.hasRole`.
3.  **Directives**: `AuthRoleRequiredDirective` also uses `DashboardAuthService.hasRole` for consistency.
4.  **Navigation**: `navLinks.ts` defines role requirements for menu items, which are enforced by `authenticated-layout.component`.

### Supabase Environment Detection & Local Email Fallback

**Date**: 2026-02-19
**Context**: Configuring email systems to send to Resend in production, but route to the Supabase local Inbucket (Mailpit) instance during development.
**Learning**:

1. **Detecting Local Env**: In Supabase Edge Functions, you can determine if you are running locally inside the Supabase Docker container by checking the `SUPABASE_URL` environment variable. Locally, it often resolves to the API gateway (e.g., `http://kong:8000`). Checking `Deno.env.get('SUPABASE_URL')?.includes('kong')` or the absence of production keys (`RESEND_API_KEY`) is a reliable heuristic.
2. **Local Inbucket SMTP**: The local Supabase environment runs an email sink called Inbucket (formerly Mailpit). This service exposes an SMTP server on port `1025` internally inside the docker network (even though the web interface is mapped to 54324).
3. **Usage via Edge Functions**: You can use `npm:nodemailer` in a Deno Edge function to route emails to `host: 'inbucket', port: 1025, ignoreTLS: true`. These emails will then appear in the local Supabase studio at `http://localhost:54324/`.

### Edge Functions and Triggers Architecture

**Date**: 2026-02-19
**Context**: Implementing Access Requests and Email Notifications.
**Learning**:

1.  **Dashboard API**: UI interactions should not hit the database directly with complex constraints (like `insertion`) when they represent larger domain actions. Instead, use Edge Functions under `dashboard/{module}/{endpoint}` (e.g., `dashboard/deployments/request-access`).
2.  **Modularity**: Third-party service integrations (like Resend for emails) must be modularized into `_shared/` directory (e.g., `_shared/email.ts`) rather than duplicated across multiple Edge Functions.
3.  **Database Webhooks via Edge Functions**:
4.  **Database Webhooks & Triggers**:
    - Avoid sending emails or doing external API calls synchronously from the Dashboard API Edge Functions. Use `AFTER INSERT/UPDATE` database triggers to invoke background tasks asynchronously.
    - **Trigger Method Comparison**:
      - **`public.call_edge_function(name, body)` (Preferred for Supabase Edge Functions)**:
        - _Strengths_: Dynamically resolves `project_url` and `anon_key` from `private.get_secret(...)`. This means your SQL migrations won't break across local, staging, and production environments with hardcoded IP addresses. It allows for a totally custom JSON body.
        - _Weaknesses_: Requires you to write an intermediate PL/pgSQL function to act as the trigger handler (since `call_edge_function` takes arguments).
      - **`supabase_functions.http_request(url, method, headers, params, timeout)` (Preferred for 3rd Party Webhooks)**:
        - _Strengths_: It natively constructs the standard Supabase webhook payload (`{"old_record": ..., "record": ..., "type": ...}`). It can be attached directly to a trigger `EXECUTE FUNCTION supabase_functions.http_request(...)` without an intermediate wrapper. Logs to `supabase_functions.hooks`.
        - _Weaknesses_: You must hardcode the `url` (e.g. `http://172.17.0.1:54321/...`) which will cause errors across different deployment environments unless heavily manipulated. It does not auto-inject Supabase auth headers.
    - **Recommendation**: Always use `public.call_edge_function` wrapped in a custom PL/pgSQL trigger function when invoking an internal Supabase Edge Function to ensure environment portability.
    - **Local Development Note**: The `anon_key` generated by Supabase CLI for local development is **deterministic** across all developer machines. Always seed this deterministic key into `vault.decrypted_secrets` via `supabase/seed.sql` (e.g., `select vault.create_secret('eyJhb...', 'anon_key', 'supabase local anon key');`) so that `call_edge_function` triggers work out-of-the-box locally without Missing Authorization Header errors from the Kong API Gateway. Production environments will securely override this secret via the Supabase Dashboard Vault.

### Edge Function Resource Bundling

**Date**: 2026-02-19
**Context**: Serving an HTML email template from within a Deno Edge Function without the compiler excluding the non-TS file.
**Learning**:

1. When deploying Edge Functions, the Deno bundler (esbuild) automatically statically analyzes `.ts` imports. However, it completely strips out and ignores arbitrary file types (like `.html`, `.json`) unless they are explicitly wrapped as ES Module exports.
2. The preferred native way to include these arbitrary files for use with `Deno.readTextFile()` is to declare them in the `supabase/config.toml` file under the corresponding function block.
   Example:
   ```toml
   [functions.dashboard]
   static_files = [ "./functions/dashboard/**/*.html" ]
   ```

### Agent Bootstrapping and Component Skills

**Date**: 2026-02-20
**Context**: Enforcing skill reading for Angular UI and component generation.
**Learning**: Always review `.agent/skills/angular/SKILL.md` and `.agent/skills/ui-theming/SKILL.md` before making UI or component changes. Pay special attention to:

1. Using `<button matButton>` instead of `<button mat-button>`.
2. Utilizing signal-based inputs (`input()`) and outputs (`output()`).
3. Appropriate use of semantic colors and standard tailwind classes.

### Code Organization and Refactoring

**Date**: 2026-02-20
**Context**: Refactoring backend Edge Functions (e.g., `notifyRequests`) to improve readability and maintainability.
**Learning**:

1. Always prefer smaller functions where possible. Functions should ideally be under 50 lines of code. Extract blocks like `INSERT`/`UPDATE` branch logic into their own dedicated helper functions.
2. Abstract common operations into shared utility files within the `_shared` directory (e.g., extracting template string substitution out of email edge functions into `_shared/template.ts`).

### State Management Preferences

**Date**: 2026-03-09
**Context**: Re-architecting state for complex dashboard services.
**Learning**: MobX should never be used in this codebase as it is heavily deprecated. Ensure that only Angular Signals (`signal`, `computed`, `effect`) are used for reactive state management.

### Internationalization (i18n) Imports in Standalone Components

**Date**: 2026-04-24
**Context**: Refactoring components to standalone and importing the translate pipe.
**Learning**: Never import `TranslatePipe` directly from `@ngx-translate/core`. The correct pattern for this project is to import `PicsaTranslateModule` from `@picsa/i18n` and add it to the `imports` array of your standalone component.

### Supabase and RxDB Async Initialization Race Conditions

**Date**: 2026-06-09
**Context**: Fixing race conditions and TypeError exceptions when querying `SupabaseService.db` before it was defined, or when the database was offline.
**Learning**:

1. **Ready Race Condition**: If a service inherits from `PicsaAsyncService`, `ready()` resolves immediately when `init()` resolves. In `SupabaseService`, the client and database property (`db`) were initialized in an Angular `effect()` inside the constructor reacting to `isAvailable` signal changes. Since effects run asynchronously in the next change detection/microtask cycle, `ready()` could resolve _before_ the effect ran, leaving `db` undefined. The fix was to initialize clients synchronously inside `init()`.
2. **Offline Mode & Null Checks**: When the Supabase server is offline (detected via health check ping), `isAvailable` is set to `false` and the client/database properties are not created. Consequently, all queries hitting `supabaseService.db` directly would throw a `TypeError`. Every database service interacting with Supabase (such as `AppUserService`, `PicsaDatabaseSyncService`, and `ForecastService`) must check `isAvailable()` before performing any operations on `supabaseService.db`.
3. **Async Effects in Angular**: Avoid writing asynchronous effects like `effect(async () => { await this.ready(); ... })`. Because Angular tracks dependencies synchronously, any signal accessed after the first `await` is not tracked. It also allows multiple instances of the asynchronous payload to execute concurrently, leading to race conditions. Instead, trigger the initialization of the service in the constructor and react to `this.readySignal()` synchronously in the effect, delegating asynchronous work to methods using cancellation tokens/trackers.

### Angular 21 Signal Forms and OnPush Change Detection

**Date**: 2026-06-09
**Context**: Fixing select options not updating UI when selecting options inside material overlay panels in components configured with `ChangeDetectionStrategy.OnPush`.
**Learning**:

1. **Overlay Change Detection Issue**: Angular Material components like `mat-select` render their option lists in an overlay container (`cdk-overlay-pane`) at the document root, outside the component's template DOM tree. Under `OnPush`, event-based change detection is not triggered in the host component because select events do not bubble up through the component's DOM tree.
2. **Signal Forms Solution**: Instead of using standard `FormGroup`/`ReactiveFormsModule` with manual `ChangeDetectorRef` triggers, use Angular 21's modern Signal Forms (`@angular/forms/signals`).
3. **Usage**:
   - Define a writable signal to hold the model state: `public readonly model = signal<T>(initialState);`
   - Define a signal form tree with validation: `public readonly budgetForm = form(this.model, (path) => { required(path.field); });`
   - Bind inputs in the template using `[formField]="budgetForm.field"` (importing `FormField` directive from `@angular/forms/signals`).
   - Read values reactively in the template via the model signal: `model().field`. Since the template reads a signal, any value changes automatically trigger change detection on the component view, regardless of DOM tree hierarchy or overlays.

### Leaflet Plugins and ES Module Namespace Wrapper Issue in Production Build

**Date**: 2026-07-08
**Context**: Fixing `typeError: Ai.maplibreGL is not a function` in production build when loading the climate map.
**Learning**:

1. **Namespace Import vs Plugins**: Importing Leaflet using a namespace import (`import * as L from 'leaflet'`) results in a sealed ES module namespace wrapper object (`Ai` in output chunk) under production bundling with esbuild.
2. **Dynamic Extension Mismatch**: Leaflet plugins (like `@maplibre/maplibre-gl-leaflet`) are usually packaged as CommonJS/UMD. At runtime they obtain the underlying Leaflet exports object via `require('leaflet')` and dynamically add functions to it (e.g. `L.maplibreGL`).
3. **Broken Bindings**: Because the ESM wrapper namespace object is sealed and created _before_ the plugin adds properties to the Leaflet export object, the newly added plugin methods are not visible on the ESM wrapper namespace `L`.
4. **Resolution**: By importing Leaflet as a default export (`import L from 'leaflet'`) and using `esModuleInterop: true`, the import resolves directly to the actual mutable Leaflet module exports object. The plugin and component code then reference the exact same object, ensuring that dynamically added properties/methods (like `maplibreGL`) are visible and functional.

### Supabase PostgreSQL Generated Columns and Per-Country Crop Variety Queries

**Date**: 2026-08-05
**Context**: Adding `country_code` column to `crop_data` table, updating primary key, and filtering dashboard queries by country.
**Learning**:

1. **Generated Column Nullability in PostgreSQL**: When adding or re-creating a `GENERATED ALWAYS AS (...) STORED` column in SQL migrations, PostgreSQL treats the column as nullable by default unless `NOT NULL` is explicitly declared (`ADD COLUMN id text NOT NULL GENERATED ALWAYS AS (...) STORED`). Omitting `NOT NULL` causes Supabase CLI's TypeScript generator (`gen-types`) to emit `id: string | null` instead of `id: string`.

### Climate Tool El Niño & La Niña Marker Customization & Base Tool Architecture

**Date**: 2026-08-12
**Context**: Refactoring climate chart tools to use single activeTool signal tracking, signal-based handler delegation, and inline SVG presentation styling.
**Learning**:

1. **Signal-Based Active Tool Registration**: `ClimateToolService` uses `public activeTool = signal<IToolName | undefined>(undefined)` to track the single active tool. `ClimateChartService` delegates `getPointColour`, `getPointRadius`, and `formatTooltipRow` to `this.activeToolHandler()`, set by `BaseChartToolComponent` on mount and cleared on unmount.
2. **Display Widgets vs Chart Tools**: Secondary display cards (like `ProbabilityToolComponent`) that render alongside active tools should NOT extend `BaseChartToolComponent` to prevent constructor execution from inadvertently overwriting `ClimateChartService.activeToolHandler`.
3. **C3 Inline Style Precedence**: C3 default stylesheets apply `.c3-circle { fill: currentColor !important }`. Custom point shape SVG nodes (`<polygon>`, `<rect>`, `<circle>`) must set `style="fill: ${color} !important; stroke: ${strokeColor} !important;"` inline to prevent styles from reverting to black.
4. **Responsive SVG Shape Scaling**: When replacing SVG `<circle>` nodes with `<polygon>` or `<rect>`, C3's built-in D3 resize handler cannot update `cx`/`cy` on non-circle tags. Using C3's internal scale functions (`chartApi.x(d.x)` and `chartApi.getYValue(d)`) inside a `@HostListener('window:resize')` handler guarantees accurate pixel repositioning when the browser resizes.

### Decoupled D3 Point Overlay Layer for C3 Charts

**Date**: 2026-08-13
**Context**: Refactoring `ElNinoToolComponent` and `ClimateChartService` to use a declarative D3 SVG point overlay instead of C3 DOM node manipulation.

### SVG Serialization for PNG Export & C3 Style Collision

**Date**: 2026-08-13
**Context**: Exporting C3 charts with custom D3 point overlays and SVG legends to PNG images via `PrintProvider.svgToPngBlob()`.
**Learning**:

1. **Computed Style Inlining Danger**: When cloning and serializing an SVG to render onto an HTML5 Canvas via `new Image()`, naively copying all `window.getComputedStyle(element)` properties into `style="..."` attributes causes C3 stylesheet rules (such as `.c3 path { fill: none; stroke: #000; }`) to be inlined onto custom `<path>` overlay elements. This overrides explicit `fill` attributes and makes custom shapes invisible.
2. **Exclusion and Safe Properties**: Filter computed style inlining to only essential presentation properties (`fill`, `stroke`, `opacity`, `font-*`) and explicitly exclude custom overlay groups (`.picsa-point-overlay`, `.picsa-legend-overlay`) so their explicit XML attributes and inline styles are preserved.
3. **C3 Callback Lifecycle Timing**: `c3.generate()` invokes `config.onrendered` synchronously before returning the new chart instance. Any wrapper component managing C3 lifecycle must ensure `onrendered` fires with the chart instance fully assigned to avoid downstream subscribers seeing `undefined`.

### Signal Reactivity for SVG Point Overlays & Removing RxJS Subjects

**Date**: 2026-08-13
**Context**: Modernizing `climate-tool` chart tools (`LineToolComponent`, `TercilesToolComponent`) to use Angular Signals and declarative SVG point overlays.
**Learning**:

1. **Signal Tracking in Delegate Functions**: When a central service (`ClimateChartService`) maintains an `effect()` that invokes a method on an active child component (`activeToolHandler().getPointStyle(d)`), Angular's signal reactive graph automatically tracks any signals accessed inside `getPointStyle` (such as `LineToolComponent.value()`). Updating the child signal (`this.value.set(...)`) automatically triggers the parent effect to re-run and re-sync the point overlay layer (`syncPointOverlay()`), eliminating the need for RxJS Subjects or manual event emitters.
2. **Replacing `Subject<void>` for Render Events**: Replacing `_chartRendered = new Subject<void>()` with a `chartRenderCount = signal(0)` counter provides a pure Signal API. Synchronous or async tasks (such as PNG export generation) can await render completions via a simple promise-resolver helper queue without introducing RxJS subscription leaks.

### Declarative Chart Tool Configuration & Deepmerge Overrides

**Date**: 2026-08-13
**Context**: Configuring tool availability per chart type (e.g. disabling single-series Line and Terciles tools on multi-series Temperature charts).
**Learning**:

1. **Avoid Component-Level Hardcoding**: Components like `ToolSelectComponent` should never contain hardcoded chart ID checks (e.g. `_id === 'temp_min'`). Instead, tool availability must be declared in the chart configuration layer (`libs/data/climate/chart_definitions`).
2. **Default Tool State & Merge Pattern**: Define a base `DEFAULT_TOOLS` configuration object with `enabled: true` for all tools. Individual chart definitions can then use `merge(DEFAULT_TOOLS, { [toolName]: { enabled: false } })` to selectively disable specific tools.
3. **Reactive UI Filtering**: UI components reactively compute available tools from `chartService.chartDefinition()?.tools`, checking `chartTools[tool.name]?.enabled !== false`.

### Unified Y-Value Formatting Across Chart Tools

**Date**: 2026-08-13
**Context**: Formatting overlay labels (e.g. Terciles tool thresholds) to respect chart-specific y-axis definitions (e.g. date formatting for Start and End of Season vs numeric units for Rainfall).
**Learning**:

1. **Shared Formatter Function**: Rather than hardcoding date parsing or chart type `if` statements inside individual chart tools, expose a central `formatYValue(value: number, meta?: IChartMeta, isAxisLabel?: boolean)` in `chart.utils.ts`.
2. **Service & Base Tool Delegation**: Expose `ClimateChartService.formatYValue(value, isAxisLabel)` and delegate through `BaseChartToolComponent.formatYValue(value, isAxisLabel)` so all chart tools can cleanly format any y-axis threshold or series value matching the active chart's `yFormat` (e.g. `'date-from-July'` vs `'value'`).

### Client-Side Programmatic DOCX Export Isolation

**Date**: 2026-08-19
**Context**: Implementing DOCX table export for downscaled crop probability tables in the Dashboard using `docx` and `downloadjs`.
**Learning**:

1. **Bundle Isolation**: To ensure mobile app bundle sizes remain unaffected, DOCX generation dependencies (`docx`) must be imported strictly within dashboard module services (`apps/picsa-apps/dashboard/src/app/modules/.../services/`) and never in shared mobile libraries (`libs/`).
2. **OpenXML Header Matrix Grid**: When defining multi-row merged table headers in `docx`, vertically merged cells spanning multiple columns in row 1 must maintain `columnSpan: 4` and `verticalMerge: VerticalMergeType.CONTINUE` in subsequent rows so OpenXML table grids align properly.
3. **i18n Testing in Standalone Specs**: Standalone Angular component spec files should import `PicsaTranslateModule.forRoot()` from `@picsa/i18n` rather than `TranslateModule` from `@ngx-translate/core` to comply with monorepo linting rules.

### Dashboard Documentation Architecture & Playwright Screenshot Automation

**Date**: 2026-08-19
**Context**: Designing the architecture and GitHub issue specification for the new Fumadocs-based Dashboard Documentation repository (`picsa-dashboard-docs`).
**Learning**:

1. **Fumadocs with Next.js App Router**: Fumadocs provides the optimal framework for dashboard documentation due to its built-in full-text search (Orama), Tailwind styling compatibility, and rich MDX component extensibility.
2. **Deterministic Playwright Screenshot Pipeline**:
   - To eliminate visual screenshot drift and maintenance overhead, automated screenshot specs should support dual modes: a **Local Deterministic Seed Mode** (running local Supabase + dashboard dev server with fixed timestamps and seeded mock data) and a **Remote Staging Mode** (configured via environment variables).
   - Authentication states (`.auth/admin.json`, `.auth/user.json`, `.auth/guest.json`) must be captured upfront in Playwright setup projects to cleanly authenticate role-protected dashboard routes.
3. **Non-Destructive Image Annotations**: Rather than burning arrows, boxes, or text directly onto generated screenshot image files, use client-side MDX overlay components (`<AnnotatedImage />`) with coordinate-based pin badges and tooltips to keep the underlying automated screenshots clean and reusable.
4. **Authoring Quality Tooling**: Combine `cspell` (with custom agronomy and climate dictionaries) and `vale` (prose style rules) with pre-commit hooks and CI checks to maintain documentation consistency across contributors and AI generation workflows.

### Climate 3-Month Seasons, Metadata Capabilities & Climatological Year Alignment

**Date**: 2026-09-09
**Context**: Modeling country-specific 3-month forecast seasons (`OND`, `NDJ`, `DJF`, `JFM`, `FMA`), wide monthly station records, and typed station capabilities.
**Learning**:

1. **Climatological Season Alignment (July 1st Start)**:
   In Southern Africa (Zambia, Malawi, Zimbabwe), meteorological data systems align the agricultural season from July 1st to June 30th (e.g. season year 2024 spans July 2024 to June 2025). Month membership in seasons crossing December (e.g., `DJF` = Dec, Jan, Feb) belongs directly to that attributed season year without needing ad-hoc day-shifting in the frontend.
2. **Dynamic Chart Definition Descriptions**:
   When supporting multiple timespans (annual, monthly, 3-month), chart definitions in `@picsa/data/climate/chart_definitions` provide `definitionMonthly` and `definitionThreeMonth` to explicitly explain aggregation rules (e.g., rainfall totals requiring full 3-month data completeness). Use `getChartDefinitionText(chartDef, timespan)` to retrieve the active description.
3. **Station Availability & Capability Indexing**:
   Rather than having the mobile client download and parse CSV files just to discover available charts, stations are indexed with `IStationCapabilities` (tracking `schemaVersion`, `lastUpdated`, `contentHash`, and metric availability). This enables instant, synchronous chart availability filtering and robust cache invalidation.

### Multi-Runtime Monorepo Interoperability (Node, Deno, Angular)

**Date**: 2026-09-09
**Context**: Refactoring `libs/models` and `libs/utils` to guarantee clean interoperability across Node.js CLI scripts, Deno (Supabase Edge Functions), and Angular/Dashboard apps.
**Learning**:

1. **Pure TypeScript Domain Models (`libs/models`)**:
   - `libs/models` must contain **only pure TypeScript interfaces and types** with zero runtime code.
   - Any external library types (such as `c3.ChartConfiguration`) must strictly use `import type * as c3 from 'c3'` so the import is completely erased during compilation and never evaluated by Node or Deno.
   - Files reside directly in `libs/models/` (flat structure without a redundant `src/` directory), matching `libs/utils/`.
2. **Dependency Isolation in `libs/utils`**:
   - Deno edge functions and standalone Node scripts fail if `@picsa/utils` re-exports heavy root dependencies (e.g. Angular router/core, rxdb, xlsx, xml).
   - Keep platform-agnostic, dependency-free utilities (`climate.utils.ts`, `object.utils.ts`, `async.utils.ts`) isolated so they rely only on native JavaScript/Web APIs (`Math`, `Array`, `Map`, `crypto.subtle`) and can be safely imported anywhere.

### Climate Data Sync CLI, Deterministic CSV Transformations & Audit Pipeline

**Date**: 2026-09-09
**Context**: Implementing Issue #14 Phase 1 (Issue #688): building the pure transformation utilities, station capabilities indexing with SHA-256 hashing, and automated change auditing pipeline.
**Learning**:

1. **Deterministic CSV Formatting & Column Omission**:
   - For rain-only meteorological stations, omitting temperature columns altogether (`month,Rainfall` vs `month,Rainfall,Tmin,Tmean,Tmax,TmeanMin,TmeanMax`) cuts file size by >60% (~150 bytes vs ~420 bytes per year-set).
   - Floats should always be rounded to 1 decimal place (`Math.round(val * 10) / 10`) during ingest/transformation to eliminate sensor noise and float representation drift across different database drivers.
2. **Idempotent CLI Runner with SHA-256 Hashing**:
   - The CLI runner (`apps/picsa-scripts/src/climate/sync-climate-data.ts`) computes SHA-256 hashes of canonical station data. If the incoming hash matches `STATION_CAPABILITIES[stationId].contentHash` and the CSV content is identical, the existing `lastUpdated` timestamp is strictly preserved.
   - This ensures re-running the sync pipeline generates **zero git diffs**, preventing spurious PRs and unnecessary mobile cache invalidations.
3. **TSX tsconfig-paths Resolution in Monorepos**:
   - When executing standalone TypeScript scripts using `node ./node_modules/tsx/dist/cli.mjs` from the repository root, pass `--tsconfig tsconfig.base.json` so that path aliases defined in the base configuration (`@picsa/models`, `@picsa/utils`) resolve correctly at runtime.
4. **Per-Country Station Capabilities & Retroactive Baselines**:
   - Grouping stations by country (`data/stations/<country>/`) with separate `metadata.ts` (human-curated names/coordinates) and `capabilities.generated.ts` (machine-generated hashes, chart availability, missing year counts) isolates country-level PRs and prevents large monolithic merge conflicts.
   - Modeling `monthly?: IChartId[]` as a string array symmetrically matches `annual?: IChartId[]`, simplifying UI availability checks (`station.capabilities?.[timespan]?.includes(chartId)`).
   - In legacy meteorological data files (e.g. Zimbabwe Climsoft exports), `0` placeholders in season columns (`Start=0, End=0, Length=0, Rainfall=0`) must be normalized to `null` to accurately count missing years in $[Y_{\min}, Y_{\max}]$.


