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
- **Parallel Dev Server Ports & Worktree Concurrency**:
  - The frontend app (`picsa-apps-app`) defaults to `4200` (range `4200..4229`), while the dashboard (`picsa-apps-dashboard`) defaults to `3000` (range `3000..3029`).
  - `tools/scripts/dev-serve.mjs` wraps `yarn start` and `yarn start:dashboard`. It executes cross-platform dual-stack probes (`127.0.0.1`, `0.0.0.0`, `::1`) with `exclusive: true` and auto-allocates the next available sequential port if base ports are busy.
  - Supabase `additional_redirect_urls` in `apps/picsa-server/supabase/config.toml` includes wildcard redirects (`http://localhost:*`, `http://127.0.0.1:*`) so local auth and magic links operate smoothly across non-4200 parallel worktree ports.
  - Dev servers write ephemeral `.serve-info.json` to the worktree root (unlinked on exit) and expose `yarn open` to launch or inspect the active worktree server.
- **Nx Socket Length on macOS Worktrees (`NX_SOCKET_DIR`)**: Deeply nested worktree paths (e.g. `/Users/.../.t3/worktrees/...`) exceed the 104-byte Unix domain socket length on macOS, crashing `nx` commands with `Attempted to open socket that exceeds the maximum socket length`. `tools/ai/_shared.mjs` sets `NX_SOCKET_DIR: process.env.NX_SOCKET_DIR || '/tmp'` so all agent lint/test scripts operate safely across deep parallel worktrees.

---

## 2. Multi-Runtime & Bundler Boundaries (Node, Deno, Angular)

### Pure TypeScript Domain Models (`libs/models`)

- `libs/models` must contain **only pure TypeScript interfaces and types** with zero runtime code.
- Any external library types (such as `c3.ChartConfiguration`) must strictly use `import type * as c3 from 'c3'` so the import is completely erased during compilation and never evaluated by Node or Deno.
- Files reside directly in `libs/models/` (flat structure without a redundant `src/` directory), matching `libs/utils/`.

### Dependency Isolation in `libs/utils`

- Deno edge functions and standalone Node scripts fail if `@picsa/utils` re-exports heavy root dependencies (e.g. Angular router/core, rxdb, xlsx, xml).
- Keep platform-agnostic, dependency-free utilities (`climate.utils.ts`, `object.utils.ts`, `async.utils.ts`) isolated so they rely only on native JavaScript/Web APIs (`Math`, `Array`, `Map`, `crypto.subtle`) and can be safely imported anywhere.

### MapLibre GL JS Discrete Zoom & Raster Tile Performance

- **Continuous Trackpad Zoom Stretches Raster Tiles**: MapLibre's built-in `ScrollZoomHandler` treats trackpad/wheel gestures on macOS as continuous fractional zooms, bypassing `zoomSnap` even when configured (`zoomSnap > 0`). Fractional zoom levels (e.g. 4.35) cause 256×256 raster tiles to be continuously stretched by up to `\sqrt{2}\times` via GPU texture scaling, rather than displayed 1:1 pixel-crisp at integer zoom levels.
- **Discrete Wheel Zoom & Mouse-Anchor Pan**: To achieve discrete interval zooming with pan-to-mouse centering, disable default scroll-zoom (`map.scrollZoom.disable()`) and attach a custom wheel listener (`{ passive: false }`) on the map container. Calculate target integer zoom levels with debounced/throttled deltas, unproject mouse screen coordinates (`map.unproject(mousePoint)`), and call `map.easeTo({ zoom: targetZoom, around: mouseLngLat, duration: 120 })`.
- **Eliminating Stretched Cross-Fade Artifacts (`raster-fade-duration`)**: By default, MapLibre uses `raster-fade-duration: 300` ms on raster layers. During zoom changes, lower-zoom stretched textures linger visibly while fading in newly loaded tiles. Setting `paint: { 'raster-fade-duration': 0 }` on the raster layer specification makes tile replacement instantaneous and removes blurry fade lag.
- **Snapping FitBounds**: Specify `zoomSnap: 1` in `new maplibregl.Map(...)` so that initial `fitBounds(bounds)` calculations snap camera results to discrete integers instead of settling on fractional zooms.
- **Mobile Touch Gestures (Pinch & Double-Tap)**: MapLibre's `TapZoomHandler` handles 1-finger double-tap (zooms in by 1) and 2-finger single-tap (zooms out by 1), automatically honoring `zoomSnap: 1` centered around the tap coordinates. For two-finger pinch-zoom, `TwoFingersTouchZoomHandler` allows fluid continuous zooming under fingers; when the gesture ends, listening to `moveend` and easing to `Math.round(currentZoom)` snaps any fractional zoom to the nearest integer so raster tiles render sharply. Calling `map.touchZoomRotate.disableRotation()` prevents accidental rotation during mobile pinch gestures.

### Leaflet Removal (Pure MapLibre GL JS)

- `PicsaMapComponent` (`libs/shared/src/features/map/`) and the dashboard map-admin preview run on pure MapLibre GL JS. The `leaflet`, `@types/leaflet`, `@asymmetrik/ngx-leaflet`, and `@maplibre/maplibre-gl-leaflet` dependencies have been fully removed — do not reintroduce them. If a Leaflet plugin is ever required again, import Leaflet as a default export (`import L from 'leaflet'` with `esModuleInterop: true`); namespace imports (`import * as L`) resolve to a sealed ES module wrapper in production esbuild chunks that CommonJS/UMD plugins cannot mutate.

### Edge Function Resource Bundling (`static_files`)

- The Deno bundler (esbuild) statically analyzes `.ts` imports and completely strips out non-TS files (such as `.html`, `.json`) unless declared as static files.
- To include arbitrary files for use with `Deno.readTextFile()`, declare them in `supabase/config.toml` under the function block:
  ```toml
  [functions.dashboard]
  static_files = [ "./functions/dashboard/**/*.html" ]
  ```

### Heavy Document Export Isolation (DOCX/PDF/XLSX)

- Client-side export libraries (e.g., `docx`, `exceljs`, `downloadjs`) must be imported strictly within dashboard module services (`apps/picsa-apps/dashboard/src/app/modules/.../services/`). Never import them into shared libraries (`libs/`) to prevent bloat in the mobile Capacitor app bundle.
- In `docx` table generation, vertically merged cells spanning multiple columns in row 1 must maintain `columnSpan: N` and `verticalMerge: VerticalMergeType.CONTINUE` in subsequent rows so OpenXML table grids align properly.
- **ExcelJS Conditional Formatting for Missing Translations**: To highlight blanks in OpenXML spreadsheets using ExcelJS, configure rules using `{ type: 'containsText', operator: 'containsBlanks', style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFFC7CE' }, fgColor: { argb: 'FFFFC7CE' } }, font: { color: { argb: 'FF9C0006' } } } }`. This serializes both OpenXML blank rule metadata and formula `<formula>LEN(TRIM(cell))=0</formula>`, ensuring cross-compatibility across Microsoft Excel, Google Sheets, and LibreOffice Calc.

### TSX tsconfig-paths Resolution in Monorepos

- When executing standalone TypeScript scripts using `node ./node_modules/tsx/dist/cli.mjs` from the repository root, pass `--tsconfig tsconfig.base.json` so that path aliases defined in the base configuration (`@picsa/models`, `@picsa/utils`) resolve correctly at runtime.

### macOS UNIX Domain Socket Path Length Limit (`NX_SOCKET_DIR`)

- **Max Socket Length (104/108 chars)**: On macOS/Darwin, UNIX domain sockets exceed the system character limit (`sockaddr_un.sun_path`) when running inside nested worktrees or deep directory paths (e.g. `~/.t3/worktrees/...`).
- **Symptom**: `yarn nx ...` hangs indefinitely on `- Calculating the project graph on the Nx Daemon` or fails with `Attempted to open socket that exceeds the maximum socket length`.
- **Solution**: Run Nx with `NX_DAEMON=false NX_SOCKET_DIR=/tmp/nx yarn nx <target>`.

### Unit Test Colocation Convention

- **Strict Colocation Next to Source**: Unit test specifications (`*.spec.ts`) must always be colocated directly next to the source file they test (e.g. `libs/utils/climate.utils.spec.ts` next to `libs/utils/climate.utils.ts`, and `libs/data/climate/chart_definitions/periods.spec.ts` next to `periods.ts`).
- Avoid scattering library or utility tests into consumer application folders (such as `apps/picsa-tools/climate-tool/src/app/data/`). Libraries (`libs/utils`, `libs/data`) maintain their own Nx project/Jest targets (`yarn nx test utils`, `yarn nx test data`), keeping tests discovered cleanly without jumping across the monorepo.

### Capacitor Plugin Inclusion in Monorepo (`includePlugins`)

- In this monorepo, Capacitor does not automatically discover plugins from the root `package.json`.
- Any newly installed native Capacitor plugin (e.g. `@capawesome/capacitor-app-update`, `@capacitor/push-notifications`) must be explicitly declared in the `includePlugins` array in `apps/picsa-apps/app-native/capacitor.config.ts`.
- Omitting plugins from `includePlugins` causes `npx cap sync` to skip them in `capacitor.settings.gradle` and `capacitor.build.gradle`, causing runtime failures with `Plugin ... is not implemented on android``.

### Firebase SDK Version Skew & Private `@firebase/*` Imports

- `rxdb@14` pins `firebase@9.23.0` and `rxdb@16` pins `firebase@11.3.0`, so two Firebase major lines coexist in the dependency graph.
- `firebase/app` (9.x) creates app instances in its nested `@firebase/app@0.9.x` registry, while a deep import such as `@firebase/performance` resolves the hoisted `@firebase/app@0.11.x` (11.x) registry. Calling `getPerformance(app)` then throws `Service performance is not available`, because the performance component was registered against the other registry.
- Never deep-import private `@firebase/*` packages. Use the public `firebase/<product>` entry points (same copy as `firebase/app`), and for native tracing use `@capacitor-firebase/performance` exclusively — the browser performance SDK adds nothing inside a Capacitor WebView.

### Capacitor Push Notifications & User Profile Sync Lifecycle

- **Deferred On-Demand Permission Requests**: Never invoke `PushNotifications.requestPermissions()` immediately on app startup. Calling permission prompts immediately degrades user trust and leads to permanent denials. Instead, call `checkPermissions()` on startup to initialize listeners only if already granted. Use an in-app trigger (such as a header notification banner) so users grant permissions with clear contextual intent.
- **Listener Registration Order Before `register()`**: Call `PushNotifications.removeAllListeners()` and register event listeners (`registration`, `registrationError`, `pushNotificationReceived`, `pushNotificationActionPerformed`) _before_ invoking `PushNotifications.register()`. On native platforms (iOS and Android), the registration callback can emit immediately during `register()`, causing early token events to be dropped if listeners are attached afterwards.
- **Client FCM Token Restoration on Startup**: When loading an existing user profile from `app_users`, restore `dbProfile.fcm_token` into the local `fcmToken` signal if not already set. Because `userProfile` is a computed signal (`fcm_token: this.fcmToken()`) and `pendingDBUpdate` computes diffs against `dbProfile`, failing to restore `dbProfile.fcm_token` causes the computed signal to emit `fcm_token: null`, scheduling an update that inadvertently clears the user's stored FCM token in Supabase.
- **Push Token Logging Security**: Never log raw device push tokens (`token.value`) in console outputs. Redact tokens to avoid exposing sensitive push credentials in production device logs.

### TypeScript Strictness & SonarCloud Rules (S2871, Number Parsing, Duplication)

- **Deterministic Array Sorting (S2871)**: Never use bare `Array.prototype.sort()` or `toSorted()` on string arrays or object keys. Always supply an explicit comparator `(a, b) => a.localeCompare(b)` to avoid locale-dependent sorting anomalies.
- **Strict Number Checks & Parsing**: Always use `Number.isNaN()` and `Number.parseInt(..., 10)` rather than global `isNaN()` and `parseInt()`. The global variants perform loose implicit type coercions (e.g. `isNaN(undefined) === true`, `isNaN(null) === false`), whereas `Number.*` methods operate strictly on numbers.
- **SonarCloud Duplication Prevention (Dictionaries & Grade Records)**: Defining repetitive structural configurations (e.g. grade settings, thresholds, hex colors, and size properties) across multiple constants can trigger Sonar's block duplication detector. Separate styling and definitions into modular JSON/object literals (`EL_NINO_STYLES`, `EL_NINO_DEFINITIONS`) and compose them using object spread syntax. This preserves crystal-clear JSON readability for reviewers while preventing large multi-line object block duplication (≥ 10 lines) in SonarCloud.
- **Publicly Writable Directory Security (S5443)**: Never hardcode '/tmp/...' string literals in Node/JS tool scripts or production code. Sonar flags any hardcoded '/tmp' directory paths as high-severity security vulnerabilities. Instead, derive paths dynamically or avoid invoking temporary file writes.
- **Child Process Untrusted Environment PATH (S4036)**: When passing a custom 'env' object to child_process execution, Sonar requires that PATH is either explicitly restricted to trusted system directories or not overridden loosely. Where possible, avoid invoking shell commands from script helpers if the same information can be resolved via in-memory data structures.
- **Floating Unhandled Promises (S9383)**: Invoking an async method without await inside a non-async or event-handling context triggers Sonar's Reliability C-rating bug. Always prefix intentionally backgrounded promises with 'void' (e.g. 'void this.refreshStation(row);').
- **Sequential Async Execution Without Await-in-Loop (S9382)**: Sonar flags await inside loops. When sequential processing is required (e.g. sequential API updates with reactive progress counters), use 'await items.reduce(async (prevPromise, item) => { await prevPromise; await processItem(item); }, Promise.resolve())' to avoid AST loop constructs while maintaining clean sequential execution.

### ngx-extended-pdf-viewer Assets in Standalone Tool Builds

- `PicsaPdfViewerComponent` loads pdf.js worker/locale assets from `/assets/pdf-viewer` at runtime. The super app's asset list does **not** apply to standalone tool builds, so any tool whose project renders the viewer must declare the glob in its own `project.json`:
  ```json
  {
    "glob": "{*.min.mjs,images/*,locale/en-US/*,locale/locale.json,standard_fonts/**}",
    "input": "node_modules/ngx-extended-pdf-viewer/assets/",
    "ignore": ["**/*-es5.min.mjs"],
    "output": "/assets/pdf-viewer"
  }
  ```
  Without it the viewer still builds, but fails silently in the browser with 404s. The glob deliberately excludes the `*-es5` bundles and non-`en-US` locales (see the viewer's locale note).

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
- **Database Seeding & Foreign Key Deletion Ordering**: Supabase preloads the PostgreSQL `safeupdate` extension, which blocks any `DELETE` lacking a `WHERE` clause (`ERROR 21000: DELETE requires a WHERE clause`). In `db-seed.ts`, reading the first column from each table's seed CSV header and querying `.not(firstCol, 'is', null)` satisfies `safeupdate` dynamically without manual per-table column mappings. Additionally, tables must be emptied in reverse dependency order (children before parents, e.g. `locales` before `countries`, `user_roles` before `deployments`) and seeded in forward order (parents before children) to avoid foreign key violations.
- **Station Climate Data Availability & Filtering**: In `capabilities.generated.ts`, stations without data files have `years: []` (empty array) rather than omitting entries or adding redundant boolean flags. `hasStationClimateData(station)` checks `Boolean(station?.capabilities?.years?.length)` (along with chart types). In `ClimateDataService`, `allStations` provides all registered country stations while `stations` filters by `!station.draft && hasStationClimateData(station)` so frontend tools only present stations with local CSV summaries.

### Remote DB Mirroring & Extended Seed Architecture (`db:seed:extended` / `remote:pull`)

- **Unified Seed Architecture in `db-seed-export.ts`**:
  Instead of fragile external dump scripts, `db-seed-export.ts` handles both CSV export and direct database seeding.
  - `SEED_DATA_BASE` (`scripts/db-seed/db-seed.config.ts`): Base schema, sort orders, priorities, column mappings, and metadata omissions.
  - `SEED_DATA_CONFIG`: Extends base with subset filters (e.g. `SEED_STATION_IDS`) for committing minimal baseline CSVs to `supabase/data`.
  - `SEED_DATA_EXTENDED_CONFIG`: Extends base _without_ filters to clone complete datasets directly into the local database without writing CSVs (`yarn nx run picsa-server:db:seed:extended`).
- **Admin Permissions on Deployments**:
  The seeded admin user (`00000000-0000-0000-0000-000000000000` / `admin@picsa.app`) requires rows in `public.user_roles` for every active deployment in `public.deployments` with roles `['admin', 'deployments.admin']`. This populates the `picsa_roles` JWT claim via the `custom_access_token_hook`, unlocking dashboard routes and permissions. This is automatically ensured by `seedDevUsersAndPermissions()` in both `db:seed` and `db:seed:extended`.
- **Per-Table Extended Seed Cache**:
  In extended mode, `db-seed-export.ts` validates and fetches remote data first, saving records into `apps/picsa-server/scripts/db-seed/cache/<table_name>.json` (gitignored). Offline seeding can be run via `yarn nx run picsa-server:db:seed:extended --no-fetch`.
- **Extended Storage File Cache (`StorageFileCache`)**:
  Because extended seed resets the local DB (emptying `storage_objects`) before mirroring, referenced remote files were previously re-downloaded on every run. `scripts/utils/storage-cache.utils.ts` now keeps bytes plus a `manifest.json` under `scripts/db-seed/cache/storage` (gitignored, alongside the record cache). Freshness is decided by diffing that manifest against remote `storage.objects` metadata (`size`/`eTag`/`updated_at`, read via the exposed `storage` schema, batched 100 names/request) so unchanged files are uploaded from disk. Downloads/uploads run with bounded concurrency and orphaned cache entries are pruned at the end of a full (non `--tables`/`--country`) run. Cache reuse requires remote confirmation: a path missing from a _complete_ `storage.objects` lookup is treated as a cache miss so deleted remote objects are never resurrected from disk (the size-only fallback applies only when the lookup itself failed). `--no-download` seeds storage from the cache only, making `db:seed:extended --no-fetch --no-download` fully offline.
- **Extended Storage Mirroring (`mirrorStorage`)**:
  Tables declaring `mirrorStorage: ['<path-column>']` in `db-seed.config.ts` (currently `forecasts.storage_file`) have their referenced files downloaded from remote into local buckets ahead of row upserts, giving 1:1 local fidelity with working downloads. This ordering is load-bearing: `forecasts_storage_file_fkey` rejects rows whose paths are absent from `storage_objects` (verified live), so files must land before rows. Never use `columnMappings` to rewrite storage paths on import — it silently corrupts references (all short-term forecasts once mislabelled as samples this way); unmirrorable files warn and null the column instead. Tombstoned rows (`storage_file` null) are preserved as nulls, never revived.
- **Dev Users & Storage Seeding**:
  `supabase/seed.sql` creates local dev users (`admin@picsa.app`, `user@picsa.app`) automatically on `supabase db reset`. In extended mode, `db-seed-export.ts` directly seeds local storage objects and baseline configurations post-import so local logins work out of the box.

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

### Edge Functions Deployment in Release Pipelines

- **Release Workflows**: Deploy all functions during release via bare `yarn nx run picsa-server:supabase functions deploy --project-ref $SUPABASE_PROJECT_ID`. This is atomic and zero-downtime on Supabase's Edge Runtime (Deno). Keep `supabase/functions/` free of demo scaffolds — every subdirectory with an `index.ts` deploys as a live production endpoint (a leftover `test-fn` echo scaffold was deleted for this reason). Helper-only dirs without an `index.ts` (e.g. `tests/test-utils.ts`) are skipped by the CLI.
- **ECR Public Shared-IP Quota Trap**: The CLI's Docker bundling path pulls `public.ecr.aws/supabase/edge-runtime:<tag>` (tag baked into the pinned CLI's `pkg/config/templates/Dockerfile`). ECR Public caps anonymous pulls at **500GB/month per source IP**, and GitHub-hosted runners share egress IPs across all repos on the runner pool, so CI fails with `failed to pull docker image: toomanyrequests: Data limit exceeded`. This is not transient — retries on the same IP hit the same quota. Fix: set `SUPABASE_INTERNAL_IMAGE_REGISTRY=ghcr.io` (the CLI rewrites the image to `ghcr.io/supabase/<image>`, which has no shared-IP quota; this is also what `supabase/setup-cli@v1` does on GHA). Permanent fix: CLI >= 2.109.1 falls back ECR -> GHCR -> Docker Hub automatically on rate limits.

### Edge Runtime Phantom CORS Masking on Uncaught Exceptions

- **Uncaught Exception Behavior**: When an Edge Function throws an uncaught exception, times out, or crashes, Supabase's Edge Runtime gateway emits a plain-text `HTTP 500 Internal Server Error` with `sb-error-code: EDGE_FUNCTION_ERROR`. Because this gateway-level error page contains no `Access-Control-Allow-Origin` header, the browser's `fetch()` rejects with a misleading CORS policy error (`No 'Access-Control-Allow-Origin' header is present`).
- **Required Top-Level Exception Isolation**: Function entrypoints must use `Deno.serve(async (req) => { ... })` and wrap router execution in an outer `try/catch` block returning `ErrorResponse(error.message, 500)`.
- **CORS on All Status Codes**: All failure branches (including method rejections `400`, unhandled routes `501`, and upstream errors `502`/`504`) must include `corsHeaders` (with `'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT'`) so browser clients receive actionable HTTP status codes and structured JSON errors rather than false CORS blocks.

### Deno Edge Functions Boundary & Type Isolation

- **Pure Types Boundary**: Edge functions in `apps/picsa-server/supabase/functions/` run in Deno. `tsconfig.base.json` and `apps/picsa-server/tsconfig.json` explicitly exclude `apps/picsa-server/supabase/functions`.
- **Never Import Executable Function Files in Shared Types**: Types consumed by Angular frontend apps (`@picsa/server-types`, `apps/picsa-server/supabase/types/functions.types.ts`, `../functions/*/types.ts`) must contain only pure TypeScript type definitions and interfaces. They must **never** import or re-export from executable function files (`index.ts`). Even a `export type { ... } from './climate/index.ts'` forces TypeScript's module resolution during Angular compilation (`ng serve` / `nx serve dashboard`) to traverse and typecheck the Deno file, causing build failures (`TS2304: Cannot find name 'Deno'`, `TS2307: Cannot find module 'https://...'`, `TS5097`).

### openapi-fetch Discriminated Union Destructuring

- `openapi-fetch` returns a discriminated union: `{ data: T; error?: never; response: Response } | { data?: never; error: unknown; response: Response }`.
- **Always Destructure**: Always destructure `{ data: apiData, error: apiError, response } = await apiClient.POST(...)` and handle `if (apiError)` upfront.
- **Avoid Direct `apiResult.data?.data` Checks**: Inspecting `apiResult.data?.data && apiResult.data.data.length` without destructuring causes TypeScript and Deno typecheckers to narrow `apiResult.data` to `never` across the error branch, throwing `TS2339: Property 'data' does not exist on type 'never'`. Destructuring converts `data?: never` to a clean `T | undefined``.

### Sample Forecast Data & Local Development Fixtures

- **Avoid Backend Mock Over-Engineering**: Do not create complex programmatic PDF compilers or mock router branches in Supabase Edge Functions.
- **Static Storage Fixtures**: Fixed sample assets (such as `sample_daily.pdf`, `sample_seasonal.pdf`, `sample_weekly.html`) reside in `supabase/data/storage/global/forecasts/` and are seeded into the local Supabase `global` bucket via `yarn nx run picsa-server:seed`.
- **Zero Build Bloat**: The `apps/picsa-server/supabase/data/storage/` directory is not included in Angular `project.json` assets, ensuring sample binaries never bloat frontend production bundles.
- **Dynamic Client Stubs Over Stale Database Rows**: Avoid storing daily or weekly forecast rows in database seed CSVs because date fields expire immediately. Instead, `ForecastService` supplies dynamic fallback stubs stamped with `new Date().toISOString().slice(0, 10)` when no server forecasts exist. A `?bypassStubs=true` query parameter enables developers to bypass stubs and test raw server data integration directly.
- **Seasonal/Downscaled Retirement via `storage_file` Tombstone**: Retire forecasts by nulling `storage_file`, never by client-only filtering. All forecast queries already exclude null files, `ForecastService.reconcileForecastTombstones` purges matching RxDB docs (plus attachments) on next online sync, and the dashboard keeps listing tombstoned rows as an admin record. `bulkUpsert` never deletes, so server-side deletes/tombstones are otherwise invisible to cached clients forever. The reconcile is tombstone-only by design: mere absence from a server response must never delete, as empty dev databases would otherwise cannibalise valid bundle-seeded docs on every load (verified live: orphan-deletion wiped the `2026/seasonal/zm_en` fallback against an empty local `forecasts` table).
- **Seed Import Overwrites `storage_file` (Tombstone Resurrection Trap)**: `db-seed.ts` applies `columnMappings` on import (`forecasts.storage_file` forced to the sample PDF) and empties tables before upserting. Retired rows must therefore be _removed_ from `supabase/data/forecasts_rows.csv`, not nulled in place — nulled CSV values are overwritten back to live paths on every seed. Header-only CSVs are supported via an empty-skip guard in `importDBRows` (PostgREST rejects empty upsert payloads).
- **ZM Seasonal UUID Ordering Trap**: Legacy ZM seasonal rows use bare uuid ids while dashboard uploads use `{YEAR}/seasonal/{lang}`. Under `order('id', desc)` the stale uuid (`'c…'`) sorts ahead of current-season ids (`'2…'`), so per-country limits surface the wrong row unless old rows are tombstoned first. Match retirement predicates on `storage_file`/`label` as well as `id` — the season is absent from uuid ids.
- **Forecast Bundle Sync (`yarn scripts:forecasts:sync`)**: Offline fallback rows live in `libs/data/climate/forecasts/{mw,zm,zw}.json` (shape `{ seasonal, downscaled }`) re-exported via `index.ts` as `FORECASTS_DB: IForecastBundleRow[]`. Never hand-edit the JSON — regenerate with the script (remote by default via `.env.server`, `--local` for docker, `--country=` to scope). The script exports live rows only (`storage_file NOT NULL`), strips `created_at`/`updated_at` for diff-stable output, and sorts byte-wise by id. `resolveJsonModule` is enabled, but JSON imports are untyped so `index.ts` uses a single documented `as unknown as` cast. Forecasts display must never use count limits — rows multiply by language, so caps silently drop translations; tombstone status (`isLiveForecast`) is the only exclusion.
- **Inspecting RxDB/Dexie State From the Browser**: Dexie stores `_deleted` as the strings `'1'`/`'0'` (booleans are not indexable), so a raw-row check like `!!row._deleted` reports live `'0'` rows as deleted — always compare against `'1'` or read via the RxDB API. Related: `bulkUpsert` short-circuits byte-identical re-seeds without advancing `_meta.lwt`, so a frozen `lwt` across reloads means "nothing changed", not "writes are broken". In dev only, `wrappedValidateAjvStorage` rejects docs carrying props absent from the schema (e.g. legacy `location`), so server/bundle rows must pass through field-picking mappers like `SERVER_DB_MAPPING_V2` — raw rows go to the error bucket.

### Climate Data Sync & Upstream API Fault Tolerance

- **Upstream API 500 Fault Tolerance**: Upstream third-party Climate API endpoints periodically return 500 errors or failures on specific stations/actions (e.g. crop success probabilities). Synchronization scripts (`apps/picsa-scripts/src/climate/sync-climate-data.ts`) must record individual station request failures as operational warnings in `auditReport.warnings` rather than immediately aborting the entire country sync. Only fail catastrophically if all requests fail (indicating complete service outage or invalid credentials), allowing valid station data to be pulled and committed.
- **Upstream Station Identifier Format**: Upstream `/v2/*_summaries/` endpoints expect the display `station_name` (e.g. `MAGOYE AGROMET`), not the canonical slug (`magoye_agromet`). The slug silently returns an empty result rather than a 4xx, so `refreshUpstreamDataForCountry` validates `climate_stations.station_name` and skips malformed rows instead of falling back to the slug. New dashboard/climate actions (e.g. `monthly-rainfall`) also require redeploying the edge function; a stale deployment returns `Invalid climate action: <action>`.

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

### Signal Effects in Unit Tests (`flushEffects` vs `detectChanges`)

- **Problem**: In zoned Jest tests, calling `TestBed.flushEffects()` after a component synchronously emits an `EventEmitter` (e.g. a mocked third-party `load` callback that sets signals and emits `onMapReady`) nests an `ApplicationRef.tick` inside the already-running tick. Angular's recursion guard throws `NG0101: ApplicationRef.tick is called recursively`, which surfaces as `console.error` noise on every affected test.
- **Solution**: Drive effect flushing with `fixture.detectChanges()` instead of `TestBed.flushEffects()` in such specs. Change detection flushes pending signal effects within the same tick, eliminating the nesting while keeping all assertions deterministic.

### Internationalization (i18n) Module Import in Standalone Components

- Never import `TranslatePipe` or `TranslateModule` directly from `@ngx-translate/core`.
- The correct pattern for this monorepo is to import `PicsaTranslateModule` (or `PicsaTranslateModule.forRoot()` in specs) from `@picsa/i18n` into the `imports` array of standalone components and tests.

### Translation Asset Sync & English Locales

- `yarn scripts:translations:sync` pulls live rows from Supabase into `libs/i18n/assets`, replacing the manual dashboard "Export All" zip/copy round-trip. Archived rows are excluded by default (they are no longer referenced by the app); pass `--include-archived` to include them.
- Locale files contain translated strings only: untranslated rows are omitted rather than written as `•text•` placeholders. Translation keys are the English source text, so ngx-translate falls back to the key and displays English. Do not write `""` values either - ngx-translate treats an empty string as a valid translation and renders blank (only `undefined`/missing keys trigger fallback).
- Locale files for `*_en` codes stay `{}`. `PicsaTranslateService.setLanguage()` routes every `*_en` locale to `global_en`, which is intentionally empty, so English always resolves through key fallback.
- Untranslated strings can be surfaced for QA with `?translationDebug=1` (persisted in `localStorage`, disable with `0`) or the internal-tester toggle in the Debug Info dialog. This uses `PicsaMissingTranslationHandler` registered on `TranslateModule.forRoot/forChild`, so it applies to pipes, `instant()`, and `translateText()` without template changes. Toggling at runtime calls `reloadLang()` so rendered strings update.

### Angular Component SCSS Budgets & Scoped Selector Expansion

- **Avoid Deep SCSS Nesting**: Deep nesting in component `.scss` files (`.parent { .child { .subchild { ... } } }`) explodes compiled CSS bundle sizes because Angular's `ViewEncapsulation.Emulated` attaches host-scoped attribute selectors (`[_ngcontent-...]`) to every individual element selector in the chain. For example, a 700-line deeply nested SCSS file compiles to >15 kB, exceeding Angular's standard 4 kB production component style budget (`anyComponentStyle`).
- **Tailwind First**: Follow project convention #7 by applying Tailwind utility classes directly in templates for layout, flexbox/grid, spacing, typography, and badges. Reserve component `.scss` exclusively for styles requiring pseudo-elements, complex coordinate positioning (like table `position: sticky`), or dynamic data-attribute color maps. Refactoring deeply nested SCSS to Tailwind can reduce stylesheet size by over 90% (e.g. from 15.1 kB down to 1.5 kB), keeping components comfortably within default budget limits without needing budget overrides in `project.json`.

### Angular Material Dialog Overrides & Mobile Padding (`panelClass: 'no-padding'`)

- **Global Dialog Padding**: `libs/theme/src/_overrides.scss` sets `.mat-mdc-dialog-surface { padding: 24px; }` by default.
- **Custom Dialog Components**: Custom dialog components that define their own internal `.dialog-header`, `.dialog-body`, and `.dialog-actions` MUST pass `panelClass: 'no-padding'` in `dialog.open()` configuration. Without this, the global 24px surface padding wraps the internal padding, producing severe double-padding (>120px wasted width on mobile), squeezing text columns to 3–4 words per line, and pushing bottom action buttons offscreen.
- **Auto-Focus Suppression**: Pass `autoFocus: false` in `dialog.open()` when opening informational dialogs whose first element is a close icon button. This prevents Angular Material from immediately focusing the close button and drawing an MDC circular focus/state ring over header titles.

---

### Material Icon Glyph Clipping (`mat-icon` and Line-Height Traps)

- **Root Cause of Icon Clipping**: Angular Material's `mat-icon` uses font-based glyphs sized to `24px` with `line-height: 1`. Applying Tailwind classes like `!w-5 !h-5 !text-lg` causes `text-lg` to set `line-height: 1.75rem` (28px) inside a `20px` (`h-5`) bounding box. This forces the glyph outside its container bounds, causing the icon to be sliced or clipped at the edges.
- **Rule**: Never combine arbitrary Tailwind `text-*` and `w-*/h-*` on `mat-icon` without matching line-height (`leading-none`). Preferably, let Angular Material manage the icon size naturally or use standard 24px sizing, or specify `class="!text-[16px] !w-4 !h-4 leading-none"` when creating micro badges.

### Fixed-Height Dialog Containers for Tabbed Content

- **Consistent Dialog Height**: When presenting tabbed content (e.g. `mat-tab-group`) inside a modal where tabs have varying lengths (e.g., compact location summary vs long scrollable tables/charts), dialogs configured only with `maxHeight: '90vh'` will dynamically expand and shrink when switching tabs, creating jarring layout shifts.
- **Rule**: Set explicit fixed height (`height: '90vh'`, `maxHeight: '90vh'`) in `MatDialogConfig`, use `panelClass: 'no-padding'`, configure `:host { display: flex; flex-direction: column; height: 100%; width: 100%; box-sizing: border-box; }`, and set inner tab containers to `flex-1 min-h-0 overflow-y-auto`. This locks the dialog to its max dimension consistently across all tabs.

### Jest ESM Transformation & Native Mocks in Tool Specs

- **Jest ESM `transformIgnorePatterns`**: When testing components in tools that import modern ESM libraries (`rxdb`, `ky`, `@uppy`, `@awesome-cordova-plugins`), Jest throws `Cannot use import statement outside a module`. Ensure the project's `jest.config.ts` includes these packages in `transformIgnorePatterns` (matching `libs/shared/jest.config.ts`).
- **Cordova/Native Providers Mocking in Angular TestBed**: Services using `NativeStorageService` inject `FileOpener` from `@awesome-cordova-plugins/file-opener/ngx`. In component unit tests where native features are transitively instantiated, provide `{ provide: FileOpener, useValue: {} }` or mock the high-level service (`ResourcesToolService`) directly to prevent `NG0201: No provider found for FileOpener` runtime errors.
- **Async `ngOnInit` in Zoneless TestBed**: `await fixture.whenStable()` resolves before an async `ngOnInit` load chain completes, so signal assertions read initial values. After `fixture.detectChanges()`, await a macrotask (`await new Promise((resolve) => setTimeout(resolve))`) to drain the pending microtasks before asserting.

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

- **Sidebar Customization vs Bottom Clutter**: Deep tool customization controls (such as the ENSO grade filter chips) should reside in the sidebar/drawer options panel (`climate-chart-options`) rather than stacked below the fixed-height chart in `chart-layout`. On mobile viewports, controls below the chart are hidden offscreen, whereas the drawer ensures immediate accessibility.
- **Single Scroll Container & Preventing Layout Shifts**: Never declare `overflow-y: auto; height: 100%` inside child components placed within `mat-sidenav` / `picsa-sidenav-layout`. The outer sidenav inner container already provides vertical scrolling. Adding an inner scroll creates a double scrollbar and robs horizontal width (~16px), causing flex containers to wrap onto new lines.
- **Chart Card Grid Dimensions**: In `view-select`, chart cards maintain their standard dimensions (`max-width: 80px; width: 100%;` with `50px` icon images and `flex-wrap: wrap; gap: 8px`), neatly laying out cards in rows of 3 without horizontal compression or truncation.
- **Inline Drawer Tool Headers & Dedicated Section Headings**: When a tool's detailed customization replaces the tool selection list, place the back button inline with the active tool's title (`.tools-header.has-active-tool`) rather than stacking a separate action row. Section headers (`Chart`, `Tools`, `Share`) provide clean visual hierarchy, pairing with focused actions like `Share Image`.
- **Handler Singleton Registration**: `BaseChartToolComponent` registers itself as `chartService.activeToolHandler` on construction and clears it on destroy. Therefore, tool components must never have duplicate template declarations. Moving a tool to `climate-chart-options` requires removing it from `chart-layout`.
- **Slot Dismissal**: Dismissing the customization slot via `toolService.disableAll()` resets `activeTool`, clearing SVG chart point/line overlays and SVG canvas legends, and gracefully restoring the tool selection view.

### Touch Gestures & Sidenav Swipe-Dismissal

- **Touch-Action Scoping & Ancestor Boundaries**: CSS `touch-action: pan-y pinch-zoom` must be placed inside Material's `.mat-drawer-inner-container` (on `.sidenav-container`), not on `<mat-sidenav>`. The browser only evaluates `touch-action` up the ancestor chain to the first scroll container.
- **Zone.js Decoupling for High-Frequency Pointer Events**: Direct `addEventListener('pointermove')` inside an Angular component causes Zone.js to run change detection on every movement frame. Always register pointer event listeners within `NgZone.runOutsideAngular()`, only re-entering `ngZone.run()` when emitting completion/dismissal.
- **Gating Touch Gestures by Drawer Mode and Pointer Type**: Do not gate gestures solely on window width/`mobileQuery` or `isNativePlatform()`. Gate dismiss gestures on `matSidenav.mode === 'over'` (avoiding interference when the drawer is pinned side-by-side in `mode === 'side'`) and `event.pointerType === 'touch'` (preventing desktop mouse selection and clicks from being captured or suppressed).

### Unified Y-Value Formatting Across Chart Tools

- Expose a central `formatYValue(value: number, meta?: IChartMeta, isAxisLabel?: boolean)` in `chart.utils.ts` and delegate through `ClimateChartService.formatYValue` and `BaseChartToolComponent.formatYValue`. This ensures date thresholds (e.g. `'date-from-July'`) and numeric values format consistently across all chart tools.

### html2canvas Table Rowspan Occlusion Bug & Transparency Fix

- **Problem**: When `html2canvas` renders an HTML table into an image, it draws rows (`<tr>`) sequentially from top to bottom.
  1. **Background Occlusion**: If `table`, `thead`, `tbody`, `tfoot`, or `tr` has any non-transparent background color (such as Angular Material MDC table's default `background-color: inherit`), subsequent `<tr>` elements draw solid background rectangles across the entire table width. This paints directly over earlier cells spanning down across multiple rows (`rowspan`), causing vertically merged cells (such as the merged top-left table header and crop names) to appear blank white in the exported image.
  2. **Row Border Slicing**: If `tr` has CSS borders (e.g. `border-top`, `border-bottom`), `html2canvas` paints row borders across the full width of each `<tr>` bounding box, cutting horizontal dividing lines directly through any multi-row merged cells (`rowspan`), visually unmerging them into sliced boxes.
  3. **Angular CDK Table Sticky with Rowspan**: CDK Table's sticky styler assigns sticky offsets (`left: 0px`, `z-index: 1`) based on cell index in `row.children`. When `rowspan` causes subsequent rows to omit column 0, cell 0 of subsequent rows receives sticky styles, conflicting with print resets and stacking contexts.
- **Solution**:
  1. Set `background-color: transparent !important; background: transparent !important; border: none !important;` on `table, thead, tbody, tfoot, tr, tr.mat-mdc-header-row, tr.mat-mdc-row, tr.mat-mdc-footer-row`. Only individual `th, td` cells should have borders.
  2. Apply background colors solely to individual table cells (`th, td`) and the outer print container.
  3. Table cells with `rowspan` must have `position: relative !important; z-index: 2 !important;` so their stacking context sits above unpositioned row elements and overrides any `position: static !important` applied to CDK sticky cells.
  4. Wrap inner text in spanning cells with a child element (`<span>`) styled with `position: relative; z-index: 3;`.
  5. In `PrintProvider.shareHtmlDom`, use `html2canvas(clone, { onclone: (_doc, el) => { ... } })` to defensively set transparent backgrounds and `border: none !important` on all `tr, thead, tbody, tfoot` elements, and ensure `td[rowspan], th[rowspan]` are elevated with `position: relative !important; z-index: 2 !important`.

### JSDOM C3 Layout Crash with Arbitrary Tailwind Classes in Unit Tests

- **Problem**: When a component importing `PicsaChartComponent` is tested in Jest/JSDOM, C3 initialization (`c3.generate`) queries `d3.style(el, 'font-size')`, triggering JSDOM's `window.getComputedStyle()`. JSDOM's CSS selector engine (`nwsapi`) fails with syntax errors when evaluating stylesheet rules that contain Tailwind arbitrary value class selectors (e.g. `min-h-[280px]`).
- **Solution**: In unit tests for parent dialogs/components containing charts, mock or override `PicsaChartComponent` in `TestBed`:
  ```typescript
  TestBed.configureTestingModule({...})
    .overrideComponent(StationDiffDialogComponent, {
      remove: { imports: [PicsaChartComponent] },
      add: { imports: [MockPicsaChartComponent] },
    });
  ```

---

## 6. Domain Logic & Agronomy Data Rules

### Climatological Season Alignment (July 1st Start)

- In Southern Africa (Zambia, Malawi, Zimbabwe), meteorological data systems align the agricultural season from July 1st to June 30th (e.g. season year 2024 spans July 2024 to June 2025).
- Month membership in seasons crossing the calendar year boundary (e.g., `DJF` = Dec, Jan, Feb) belongs directly to that attributed season start year without requiring ad-hoc day-shifting in the frontend.

### Station Availability & Capability Indexing

- Rather than downloading and parsing CSV files on the mobile client to discover available charts, stations are indexed with `IStationCapabilities` (schemaVersion, lastUpdated, contentHash, metric availability). This enables instant, synchronous chart availability filtering and cache invalidation.

### Climate Data Sync, Formatting & Audit Pipeline

- **Deterministic CSV Formatting**: For rain-only meteorological stations, omitting temperature columns altogether (`month,Rainfall` vs `month,Rainfall,min_tmin,mean_tmax,max_tmax`) cuts file size by >60%. Floats are rounded to 1 decimal place to eliminate sensor noise and float representation drift.
- **Idempotent CLI Runner**: The CLI runner (`apps/picsa-scripts/src/climate/sync-climate-data.ts`) computes SHA-256 hashes of canonical station data. Preserving `lastUpdated` when data hashes match ensures zero git diffs on subsequent runs.
- **Per-Country Station Organization**: Grouping stations by country (`data/stations/<country>/`) with separate `metadata.ts` and `capabilities.generated.ts` cleanly isolates PRs and prevents cross-country merge conflicts.
- **Symmetric Capability Models**: Modeling `monthly?: IChartId[]` as a string array symmetrically matches `annual?: IChartId[]`, simplifying runtime availability checks (`station.capabilities?.[timespan]?.includes(chartId)`).
- **Missing Years Normalization**: In legacy data files (e.g. Zimbabwe Climsoft exports), `0` placeholders in season columns (`Start=0, End=0, Length=0, Rainfall=0`) must be normalized to `null` to accurately count missing years in $[Y_{\min}, Y_{\max}]$.
- **Within-Batch Duplicate Observation Handling**: Upstream sync feeds can emit multiple records for the same station, month, and metric (e.g. overlapping time slices or correction batches). `pivotLongToWideMonthly` tracks duplicates via `IPivotOptions.onDuplicate`. Identical duplicates are de-duplicated cleanly, while conflicting values (`existing !== incoming`) log warnings and are captured as `DUPLICATE_OBSERVATION_CONFLICT` violations in the audit report.
- **Git Commit Date Retrieval & Timestamp Idempotency**: Station `lastUpdated` uses a clean `YYYY-MM-DD` date derived from `git log -1 --format="%as"` over the station's CSV files. When `contentHash` is unchanged across subsequent runs, the existing `lastUpdated` is strictly preserved, guaranteeing 100% idempotency (zero git diffs).
- **Upstream Climate API Exclusively on `/v2` (No `/v1` Fallback)**: Upstream `/v1` is legacy and deprecated for planned shutdown. All edge functions, scripts, and endpoints must strictly route to `/v2` (`https://api.epicsa.idems.international/v2/...`). Do NOT introduce fallbacks to `/v1`. Upstream database connection pooling has been enabled to resolve concurrency bottlenecks; handle transient query timeouts (`QUERY_TIMEOUT` / 504) gracefully by forwarding structured, retryable errors to the client rather than failing over to `/v1`.
- **WMO Numeric Identifiers vs Named Station Collisions**: Upstream `/v2/station/zw` returns two entries per physical station: a named station (e.g. `BUFFALO RANGE (MET)`) and a numeric WMO index number (e.g. `67977040`). Numeric IDs return empty summaries on `/v2/annual_rainfall_summaries/`. Replacing non-alphabet characters (`/[^a-z]/gi`) collapses all numeric IDs into a single corrupted collision slug (`zw/________`). The sync pipeline must filter out numeric station rows, map the WMO numbers to `met_station_id`, and slugify named stations with clean single underscores (`buffalo_range_met`).
- **Zambia Climsoft & AWS Duplicate Station Filtering**: `/v2/station/zm` emits duplicate 8-character Climsoft legacy codes (`CHIPAT01`) alongside canonical names (`CHIPATA MET`), as well as empty AWS stations (`CHIPATA MET AWS`). The sync edge function must filter these out when the base station exists to prevent duplicate cards in the app and dashboard.
- **District Preservation & Non-Destructive Sync**: Upstream feeds return `district: null` for ZW and MW. Rather than maintaining fragile hardcoded dictionary mappings in the application or edge functions, missing districts are populated one-time via database migrations. The sync edge function preserves existing non-null database values (`existingDistrict || d.district || null`), ensuring subsequent sync runs never overwrite existing districts with `null`.

### Automated Quality Control & `qcFailures` Array

- **Discrete Failure Codes**: Stations are evaluated against explicit scientific quality gates (`libs/utils/climate-qc.utils.ts`):
  1. `insufficient_total_years`: Total rainfall years < 30.
  2. `no_recent_data`: Fewer than 1 rainfall observation year in the past 10 years.
  3. `sparse_recent_data`: Fewer than 10 rainfall observation years in the past 30 years.
  4. `season_discrepancies`: Unpaired start/end of season boundaries (`Start` without `End` or vice versa).
- **Clean Model & Zero Half-Features**: Station QC status is represented cleanly by `qcFailures?: ClimateQcFailure[]` on `IStationCapabilities` (defined in `libs/models/climate.models.ts`). An empty array (`[]`) signifies that the station passed automated QC.
- **Automated Draft Status Resolution**: `resolveStationDraftStatus(qcFailures)` automatically marks stations as `draft: true` if `qcFailures` is undefined or non-empty, and `draft: false` (published) only when `qcFailures.length === 0`.
- **UI Non-Alarmist Neutral Grey**: In dashboard admin QC tables and difference tables, failing stations or unassessed stations are styled in neutral slate grey badges (`bg-slate-100 text-slate-700 border-slate-300`), not red/warn, because inactive or historical stations with insufficient data are expected operational states rather than system errors.

### Multi-Column Climate Product Diffing & Overlaid C3 Preview

- **Product-Level Diff Granularity**: Meteorological stations contain multiple products (`rainfall`, `start`, `end`, `length`, `temp_min`, `temp_max`, `extremes`). Comparing data across databases and bundled app summaries requires product-level aggregation: detecting added years in DB, missing years in DB, and value changes exceeding floating-point tolerance (`|db - app| > 0.05`).
- **Overlaid C3 Preview & SVG Stacking**: When previewing differences between DB data and bundled App data, overlay both series on identical axes using suffixed keys (`_app` first, `_db` second, with `data.order = null` to maintain series insertion order in C3/D3). App data lines are styled wider (`3.5px` stroke, `r: 4px` points) underneath the DB line (`2px` stroke, `r: 2.5px` points), and both use semi-transparent `rgba(...)` fills/strokes so identical values and overlapping points remain clearly visible.
- **Empty Dataset vs Error State**: In database queries, empty product responses serialize as empty arrays (`[]`). Simple truthiness checks (`Boolean(data)`) evaluate to `true` for empty arrays. Code verifying data availability must check `Array.isArray(data) ? data.length > 0 : Boolean(data)` to treat empty responses as missing/error rather than available.

### RONI ENSO Season Classification & Grade Definitions

- **RONI Event Criteria**: A season is classified as El Niño (or La Niña) when the running 3-month mean SST anomaly equals or exceeds $+0.5^\circ\text{C}$ (or $\le -0.5^\circ\text{C}$) for at least 5 consecutive overlapping 3-month periods. For example, 1953-1954 has 5 consecutive periods $\ge +0.5^\circ\text{C}$ (JJA to OND) and is classified as Weak El Niño (`WE`, grade 1), preserving historical continuity in `EL_NINO_YEARS`.
- **Season Continuity**: The RONI dataset maintains continuous season records through the station data projection range (e.g. 2026-2027) so charts with recent or projected years have well-defined records rather than missing keys.

### Climate Tool Trendline Analytics & Presentation Rules

- **Display Rule & Cutoff**:
  - A trendline is plotted **only** when statistically clear ($p < 0.05$). It is rendered as a **solid coloured line** in the series color (`strokeWidth = 2.5`).
  - When $p \ge 0.05$ (inconclusive / no clear trend) or data is insufficient, **no line is plotted** to avoid visually asserting an unconfirmed directional trajectory. Grey dashed lines are strictly prohibited on public graphs.
- **Card Header & Rate Alignment in Sidenav Panel**:
  - Always render the series/chart heading (`item.label | translate` with series color dot) across both single-series and multi-series charts. Never suppress the heading based on series count (`@if (analyses.length > 1)`).
  - In the outcome badge row, use flexbox `justify-between` and toggle `invisible` (`visibility: hidden`) with `[attr.aria-hidden]="!showRate"` on the rate label when $p \ge 0.05$ or rate is absent. This hides the numeric rate while maintaining consistent badge alignment to the right and preventing card height collapse.
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

### Crop Admin Locations & Station Selection Probability Availability

- **Linked Station Probability Status**:
  - In `CropLocationCoverageComponent`, each district/location displays a dedicated **Probabilities** column using concise icon-only indicators (avoiding redundant text/counts since "No station" is already covered by the Linked Station column and summary totals appear in the header legend):
    - **Check mark** (`check_circle`, green): station is linked and has crop probability records in `climate_station_data.crop_probability_data`.
    - **Warning** (`warning`, amber): station is linked but has no probability records in `climate_station_data` (downscaled tables cannot be calculated).
    - **No Station** (`link_off`, gray): no climate station is linked to this location.
  - The Locations tab header includes summary badges tracking `Probabilities Available` and `Missing Probabilities` counts across all locations.
  - In the station picker modal (`CropLinkedStationSelectComponent`), dropdown options display clean status icons (`check_circle` vs `warning`) alongside district tags, and a contextual status card is displayed beneath the dropdown explaining whether probability records exist for the selected station before committing the change.
- **Multiple Valid Stations in Same District (e.g. Salima vs Salima Airport)**: National meteorological services may operate multiple valid stations within the same district (such as `mw/salima` town/boma and `mw/salima_airport`). In production Supabase, `crop_data_downscaled` for district `salima` is linked to `mw/salima_airport`, where `crop_probability_data` has 1,750 records computed upstream. Both stations are valid, and no schema or data alteration is needed.
- **Shared Geo Location Data Must Never Be Mutated**: `getGeoLocationData()` returns the module-level per-country singleton by reference. Location filters (e.g. crop-probability `locationModifier`) must be pure and return new objects. The location overlay destroys/recreates its select on every open (`@if (open())`), re-running the filter on the same shared object - an in-place filter/add-tier implementation permanently corrupts it (mw's synthesised `admin_5` tier was wiped on second open, leaving the sublocation dropdown empty). See `filterLocationsToProbabilityTables` and its idempotence specs.

### Farmer Video Data & Dashboard Matrix Coupling

- **Step Identity Is Implied by Array Order**: The dashboard "Direct-to-Farmer Videos" matrix (`resources-farmer-videos.utils.ts`) derives each `stepNumber` from the index in `PICSA_FARMER_VIDEOS_DATA` (`libs/data/resources/videos/picsaSteps.ts`), and `useLocalizedEn` is forced for steps 7 and 8. Reordering or inserting entries therefore silently renumbers steps and changes English expectations — do it deliberately and update the matrix spec counts.
- **Supplementary Videos Belong to a Step**: A video that appears in a farmer-content step but is not one of the 8 PICSA steps (e.g. the Zambia-only `el_nino` explainer in module 7) must be registered in `SUPPLEMENTARY_STEP_VIDEOS` so the matrix keeps its parent step number and English handling instead of showing a phantom new step.
- **Country Scoping Is Derived From Variants, Not Hardcoded**: For supplementary step videos, `getVideosForCountry()` includes the video only when at least one child variant's locale belongs to that country. Never hardcode a country for such a video — adding a variant for a new country should make it applicable there automatically with no code change.
- **Farmer Steps Are Hidden When No Variant Matches the Deployment**: `FarmerContentModuleHomeComponent.visibleSteps` filters video/videoPlaylist steps through `hasVideosForUser` (see `step-video.utils.ts`, shared with `FarmerStepVideoComponent`). This stops country-specific videos rendering as empty cards (e.g. Zambia-only videos for Malawi users) and makes the step appear automatically once variants for that country are added.
- **Data Entry Requires Hosted Assets**: Video entries reference Supabase public URLs; the media pipeline (`yarn scripts media/process`) only writes normalised 360p files to a gitignored `output/` folder. Uploading those files to the matching bucket path (`<country>/videos/...`) is a separate manual step, and the URL filename must match the uploaded object exactly. Follow the bucket naming convention (`<NN>. <Title> - <Country>_<LANG>_360p.mp4`, with `BEM/NYA/TNG/ENG` language suffixes).

### Angular Material Component Conventions

- **Angular Material v21 Button Syntax**: Always use modern attribute directives (`<button matButton>`, `<button matButton="filled">`, `<button matIconButton>`). Never use legacy tag/attribute forms like `mat-button`, `mat-icon-button`, or `mat-flat-button`.

## 7. Error Handling & Monitoring Architecture

### Sentry & Firebase Crashlytics Dual-Reporting Strategy

- **Complementary Roles**:
  - **Sentry (`@sentry/angular`)**: Primary error tracking for TypeScript/JavaScript exceptions across both Web (PWA) and Mobile (Capacitor webview). Provides full source-mapped stack traces, device/platform tagging, release tracking, and breadcrumbs.
  - **Firebase Crashlytics**: Retained exclusively on Android for native OS-level crashes (via the Gradle plugin) and duplicate reporting of non-fatal exceptions via `CrashlyticsService.recordException`.
- **Initialization Timing**:
  - Sentry is initialized in `apps/picsa-apps/app/src/main.ts` via `initSentry()` _prior_ to `bootstrapApplication()` so early bootstrap and bundling failures are reported.
  - `bootstrapApplication(...).catch(...)` explicitly forwards unhandled bootstrap rejections to Sentry.
- **Central Exception Routing (`ErrorHandlerService`)**:
  - `ErrorHandlerService` overrides Angular's `ErrorHandler.handleError(error)`.
  - Automatically unwraps Angular/Zone.js errors (`(error as any)?.ngOriginalError || error`).
  - Dispatches to `Sentry.captureException(...)` when Sentry is enabled.
  - On native Android (`Capacitor.isNativePlatform()`), additionally dispatches to `crashlyticsService.recordException(...)` in a protected try/catch block.
  - Always calls `super.handleError(error)` to preserve local console output.
- **Inbound Noise Filtering & Quota Protection**:
  - In `beforeSend` (`isIgnoredErrorMessage` in `sentry.service.ts`), errors originating from browser extensions (`chrome-extension:`, `moz-extension:`, `safari-extension:`), Angular DevTools hooks, or client-side offline network drops (`Failed to fetch`, `: 0 Unknown Error`, `ERR_INTERNET_DISCONNECTED`) are discarded to avoid burning monthly event quotas, and are also excluded from native Crashlytics non-fatal exception reporting in `ErrorHandlerService`.
  - Non-`Error` objects with `.message` (such as Angular `HttpErrorResponse` or Supabase `PostgrestError`) are normalized into `Error` instances with `{ cause: error }` in `ErrorHandlerService.normalizeError()` so Sentry groups them with actionable stack traces rather than generic `Object captured as exception` titles.
  - In `ResourcesDownloadService`, `download()` resolves `null` on failure (matching `DownloadEntry.download` signature) while distinguishing offline connection drops (`status === 0` or `isIgnoredErrorMessage`) from invalid storage URLs (`404`/`403`/`500`) or local storage write failures (`putAttachment`), forwarding actionable errors to `ErrorHandlerService` and deduplicating user error notifications across `queueMultiple()` bulk downloads.
  - Sentry is enabled in production builds by default (`ENVIRONMENT.production`), with optional explicit overrides via `ENVIRONMENT.sentry.enabled`.
- **Production Sourcemaps & CI Release Ingestion**:
  - `apps/picsa-apps/app/project.json` configures `sourceMap: { "scripts": true, "styles": false, "hidden": true }` for production. `hidden: true` emits `.map` files on disk for debug symbolication while omitting `//# sourceMappingURL=` comments from bundles.
  - In release workflows (`web-release.yml` and `android-release.yml`), `sentry-cli sourcemaps inject` stamps bundles with deterministic Debug IDs and `sentry-cli sourcemaps upload` uploads them to Sentry.
  - `.map` files are deleted before hosting deployment or Capacitor sync (`find dist -name "*.map" -delete`) to prevent shipping source files to users or bundling them into native Android binaries.
- **Jest Mocking Gotcha (`@capacitor/core`)**:
  - When mocking `@capacitor/core` in unit tests, always spread `jest.requireActual('@capacitor/core')` (`{ ...actual, Capacitor: { ...actual.Capacitor, isNativePlatform: jest.fn() } }`). `@capacitor/device` calls `core.registerPlugin` during module evaluation; completely overwriting `@capacitor/core` without `registerPlugin` causes `TypeError: core.registerPlugin is not a function`.
- **Unified Error Triage & Device-ID Cross-Referencing (`yarn ai:triage`)**:
  - Both Sentry (`initSentry`) and Firebase Crashlytics (`CrashlyticsService.init`) tag errors using anonymous `Device.getId()`. When investigating native crashes from Crashlytics where a device UUID is known, query Sentry with `yarn ai:triage user <device-uuid>` to inspect preceding Angular route navigation, UI clicks, and console breadcrumbs.
  - `yarn ai:triage --doctor` checks Sentry token validity (`de.sentry.io`) and BigQuery Crashlytics streaming connectivity, reporting actionable steps if credentials are missing without failing catastrophically.

## 8. CI / CD & Nx Remote Caching Strategy

### Local-Only + CI Remote Caching Architecture

- **Nx Cloud Disabled Locally by Default**: `nx.json` contains no `nxCloudAccessToken`, so local runs use only the on-disk cache (`.nx/cache`) and consume zero Nx Cloud quota. All developers share nothing remotely by default.
- **CI-Only Remote Cache**: `.github/workflows/build-test.yml` enables Nx Cloud by setting `NX_CLOUD_ACCESS_TOKEN: ${{ secrets.NX_CLOUD_ACCESS_TOKEN }}` (read-write secret) at the job level. No token in `nx.json` means no cloud connection outside CI unless explicitly opted in.
- **Personal Opt-In**: Individual developers wanting remote cache can set their own `NX_CLOUD_ACCESS_TOKEN=<personal-or-workspace-token>` environment variable locally. Never commit personal tokens to `nx.json`.
- **Authoritative Main Caching vs Read-Only PRs**: In `.github/workflows/build-test.yml`, PR runs restore `.nx/cache` read-only from `main`. Only merges/pushes to `main` prune and save the cache archive via `actions/cache/save@v5`. This eliminates PR cache thrashing and stays within GitHub's 10 GB repository cache limit.
- **Self-Repairing Cache Pruning**: `tools/workflows/prune-nx-cache.mjs` runs before saving cache on `main`. It removes entries older than 7 days and applies LRU eviction when total cache size exceeds 1.5 GB down to 800 MB, alongside weekly calendar epoch key rotation (`$(date +%Y-W%V)`).

### Pull Request Template & PR-Agent Auto-Generation Workflow

- **Mandatory Template (`.github/pull_request_template.md`)**: Whenever opening or editing a PR, always format the description matching `.github/pull_request_template.md`:
  - `## Developer Summary`: Concise architectural highlights and context for reviewers.
  - `## Related Issues`: Clear issue links using keywords (`Closes #123`, `Relates to #456`, `Part of Epic #789`).
  - `## Screenshots / Videos`: UI / visual change evidence.
  - **Preserve AI Summary Placeholders**: The trailing section below `---` containing `## AI Summary` with `pr_agent:summary`, `pr_agent:walkthrough`, and `pr_agent:diagram` must never be removed. The repository GitHub Actions workflow triggers PR-Agent via `/describe` which replaces these exact tokens with auto-generated walkthroughs and Mermaid architecture diagrams.

### LiteLLM Model Catalog Matching in PR-Agent Check (`pr-agent-update-check.mjs`)

- **OpenRouter Catalog Removal in Upstream LiteLLM**: LiteLLM upstream removed all `openrouter/` rows from its static cost catalog (`model_prices_and_context_window.json`), because OpenRouter serves dynamic models as an OpenAI-compatible gateway.
- **Provider Prefix vs Bare Model Names**: OpenRouter model IDs include vendor prefixes (e.g. `openai/gpt-6-luna`), whereas LiteLLM catalogs OpenAI and base models using bare identifiers (`gpt-6-luna`) or dot-notation (`openai.gpt-6-luna`).
- **Compatibility Verification (`isLiteLlmModel`)**: In `.github/workflows/pr-agent-update-check.mjs`, stripping only `^(openrouter|gemini)\/` previously left `openai/gpt-6-luna`, causing catalog checks to fail with `Could not find a LiteLLM-compatible Luna model`. The helper must evaluate the bare model name (`withoutProvider.split('/').pop()`), dot-separated format, and suffix matches (`endsWith`) to verify LiteLLM support for the underlying model.

### Supabase `climate_station_data` Foreign Key Architecture (`station_id` vs `climate_stations.id`)

- **CRITICAL MAPPING GOTCHA**: In the Supabase table `climate_station_data`, the column is named `station_id`, but its foreign key constraint is:
  `constraint climate_station_data_station_id_fkey foreign key (station_id) references climate_stations (id)`
- Therefore, in `climate_station_data` rows, the field `station_id` stores `station.id` (the database primary key of `climate_stations`), **NOT** `station.station_id` (the slug).
- When indexing `allStationData` rows via `arrayToHashmap(allStationData, "station_id")`, the dictionary keys are `station.id`. Lookups MUST use `allStationDataHashmap[station.id as string]`.
- Conversely, bundled app CSV data (`allStationAppData`) is loaded from `assets/summaries/<country>/<station_id>.csv` and is keyed by `station.station_id` (the slug).
- **PR-Agent Push-Back**: Automated review bots frequently flag `allStationDataHashmap[station.id]` as a suspected bug assuming `station_id` must match `station.station_id`. This is a false positive and must be firmly pushed back on.

### Station Location & Coordinate Preservation During Climate Sync

- **Upstream Location Traps**: Upstream climate data feeds frequently contain missing coordinates (`null`), `(0, 0)` coordinates placing stations in the Atlantic Ocean, swapped lat/long values, or incorrect legacy entries (e.g. `chipepo_met` placed in Lake Kariba at `-16.79, 27.88` instead of Gwembe at `-15.79, 28.14`).
- **Preservation & Non-Destructive Sync Strategy**: In `dashboard/climate/index.ts`, `update-stations` preserves existing valid database coordinates (similar to `district`) so verified database locations are never overwritten by upstream syncs. Upstream coordinates are only ingested for new stations if they pass validation (`!(lat === 0 && lon === 0)` and valid hemispheric bounds).
- **Database-Level Guard**: Table `climate_stations` enforces `climate_stations_valid_coords` (`CHECK ((latitude IS NULL AND longitude IS NULL) OR (NOT (latitude = 0 AND longitude = 0) AND latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180))`), physically preventing invalid `(0, 0)` coordinates from entering the database.

### Selective Climate Product Sync & Monthly Lockstep (`--only`)

- **Non-Destructive Partial Syncs**: Meteorological station CSV summaries contain multiple annual and monthly metrics (`rainfall`, `start`, `end`, `length`, `temp_min`, `temp_max`, `extremes`). When executing targeted syncs (e.g. `--only=temperature` or `--only=seasonal`), existing CSV columns for unselected metrics must be strictly preserved on disk (`mergeStationAnnualData` / `mergeStationMonthlyData`).
- **Annual/Monthly Lockstep Requirement**: Temperature series depend on both annual and monthly files (`{station}.csv` and `{station}.monthly.csv`). If a station possesses `annual_temperature_data` in Supabase `climate_station_data` but lacks corresponding `monthly_temperature_data`, the sync pipeline must emit an explicit breaking warning (`❌ [BREAKING]`) and register a sanity violation in the audit report. Monthly rainfall is likewise sourced from `/v2/monthly_rainfall_summaries/` into `monthly_rainfall_data` and merged into the same monthly CSV; empty upstream responses must preserve existing monthly rainfall rather than clearing it.

### macOS AF_UNIX Socket Length in Nx Daemon

- When running in long path environments on macOS, the Nx daemon socket creation may fail with `Attempted to open socket that exceeds the maximum socket length`. Setting `NX_SOCKET_DIR=/tmp/nx-tmp` (or passing it inline to test runs) prevents this failure.

### Climate Data Sync Pipeline & Automated Upstream Ingestion

- **2-Step Sync Pipeline (Upstream Climate API -> Supabase DB -> App CSV Assets)**:
  - Step 1: Upstream Climate API data is pulled into Supabase via edge functions (`dashboard/climate/{action}` for `rainfall-summaries`, `monthly-rainfall`, `annual-temperature`, `monthly-temperatures`), saving records into `climate_station_data`. Sequential execution per station is enforced to prevent upstream API timeouts.
  - Step 2: `yarn scripts:climate:sync` pulls from `climate_station_data`, merges selectively (honoring `--only`), formats wide CSVs, recalculates capabilities in `capabilities.generated.ts`, and produces an audit report (`dist/climate-sync-report.md`).
- **GitHub Actions Isolated Country Workflow**:
  - The CI workflow (`.github/workflows/climate-sync.yml`) runs weekly on schedule or on demand via `workflow_dispatch`. It executes per country with `max-parallel: 1` to protect upstream API throughput.
  - Full git history (`fetch-depth: 0`) is strictly required in checkout so `getStationGitLastUpdatedDate()` can query `git log` without incorrectly overwriting station commit timestamps with the run date.
  - PRs are created conditionally per country (`content/climate-sync-<country>`) only if files within `summaries/<country>` or `data/stations/<country>` change, formatting the markdown audit report directly into the PR body.

### Crop SVG Vector Iconography & Botanical Design Conventions

- **Vector Line Art Style (`libs/data/crops/svgs/`)**:
  - Icons are monochrome outline vector illustrations (`stroke="#000000"`, `fill="none"` or compound cutouts), with no multi-color fills and transparent backgrounds.
  - **Square Canvas Utilization (~1:1 Aspect Ratio)**: In the card selector UI (`crop-select`, etc.), icons are placed inside square button cards (~48x48 to 80x80px). Drawings with wide horizontal aspect ratios (e.g. sprawling foliage) scale down dramatically, producing tiny icons with severe letterboxing. Always arrange elements to fill ~85–90% of both width and height within the standard `0 0 100 100` (or `0 0 64 64`) viewBox.
  - **Bold Visual Weight**: Match companion icons (Cotton, Cowpeas, Groundnuts) with heavier line weights (`stroke-width: 3.2–3.6px` in a 100x100 canvas). Avoid intricate leaf venation or fine rootlet hatching that clutters or disappears at small sizes; use clean outer contours and single central midribs.
  - **Occlusion Handling without Opaque Fills**: In UI components like `crop-select.scss`, selected items use dynamic theme backgrounds (e.g. `background: wheat`). Using opaque white fills (`fill="#fff"`) causes unsightly white boxes on colored backgrounds. To maintain transparency without background lines cutting through foreground objects, overlapping background paths must be trimmed precisely to the boundary of the foreground shapes.
- **Botanical Identifiers**:
  - **Millet (`millet.svg`)**: Distinguishable by the clean, dense cylindrical spike head of pearl millet (_Pennisetum glaucum_) without radiating awn bristles, curving upright blade leaves with natural venation, and central stalk.
  - **Bambaranuts (`bambaranuts.svg`)**: Distinguishable by the rounded subterranean pods of Bambara groundnut (_Vigna subterranea_ / "roundnuts" / _nyimo_), exactly two attached hanging pods with minimal contour marks, a single prominent loose nut on the right displaying the diagnostic oval hilum/eye, and compact upright leaves meeting at the root crown.

### DOM Element Resizing for Image Sharing (`PrintProvider.shareHtmlDom`)

- **Print Mode Width Expansion**: When exporting scrollable UI components (such as wide data tables in budget tools or crop probability tables) as images on small/mobile screens, `html2canvas` captures only the visible viewport width unless the element is explicitly expanded.
- **`.print-mode` SCSS Contract**: `PrintProvider.shareHtmlDom(selector, filename)` clones the target element, appends `.print-mode` to its class list, and attaches it to `document.body` for rasterization.
- Ensure the component defines a `#elementId.print-mode` rule with:

  ```scss
  #cropProbabilityTable.print-mode {
    position: absolute;
    top: 0;
    left: 0;
    width: 1000px !important;
    min-width: 1000px !important;
    overflow: visible !important;
    background-color: #ffffff !important;
    padding: 16px !important;

    // Reset sticky positioning on headers/cells to avoid misaligned canvas capture
    th.mat-mdc-table-sticky,
    td.mat-mdc-table-sticky {
      position: static !important;
    }
  }
  ```

- **Jest Transform Ignore Patterns**: Any app using `PrintProvider` (`@picsa/shared/services/native/print`) imports `@awesome-cordova-plugins`, requiring `transformIgnorePatterns: ['node_modules/(?!.*\.mjs$|@awesome-cordova-plugins|tslib)']` in `jest.config.ts`.
- **`PicsaFormsModule` SVG Asset Traps in Unit Tests**: Importing `PicsaFormsModule` runs `DataIconRegistry.registerMatIcons()`, which asynchronously fetches SVG assets via `HttpClient` and throws uncaught `Failed to retrieve icon` errors in JSDOM. In component unit tests, provide `{ provide: DataIconRegistry, useValue: { registerMatIcons: jest.fn() } }` to stub icon registration.

---

## 6. Climate Quality Control (QC) & Monorepo Tooling

### Nx Socket Length Trap on macOS (Worktrees)

- **Problem**: When running Jest or Nx within Git worktrees whose directory paths exceed 104 characters, the Unix domain socket creation for Nx daemon crashes with "Attempted to open socket that exceeds the maximum socket length".
- **Solution**: Always set "NX_SOCKET_DIR=/tmp/nx-tmp NX_DAEMON=false" in the environment when invoking tests via "node tools/ai/ai-test.mjs" or running "yarn nx test".

### Climate Quality Control (QC) Gates & Automated Station Drafting

- **Standalone Engine**: Quality control criteria are defined in libs/utils/climate-qc.utils.ts under "CLIMATE_QC_GATES".
  - **Min 30 Total Rainfall Years**: Evaluated strictly on valid annual rainfall observations ("hasValidRainfallObservation"), avoiding false counts from rows containing only start/end of season data.
  - **Min 1 Year in Past 10 Years**: Ensures the station has recent observations.
  - **Min 10 Years in Past 30 Years**: Ensures temporal continuity.
  - **Season Boundary Consistency**: "detectSeasonDiscrepancies" detects years where start of season exists without end of season, or vice versa.
- **QC Grading**:
  - "approved": Passes all rainfall completeness gates and has 0 season discrepancies.
  - "pending_review": Passes rainfall completeness gates but has season bound discrepancies.
  - "insufficient_data": Fails rainfall completeness gates. In the UI, this must be displayed in **neutral slate/grey** ("bg-slate-100 text-slate-700"), not red/warn, as it is non-actionable archival data.
- **Automated Drafting with Manual Overrides**:
  - In country station loaders ("stations/<country>/index.ts"), stations are mapped with "draft: resolveStationDraftStatus(station.draft, caps?.qcStatus)".
  - If a station has an explicit manual boolean override in "metadata.ts" ("draft: true" or "draft: false"), that override is preserved. Otherwise, non-approved stations automatically default to draft status and are excluded from the end-user app.

### Climate Station Quality Control & Public Tool Filtering

- **Automated Draft Status**: Climate stations are automatically flagged as draft via `resolveStationDraftStatus(caps?.qcFailures)`. Stations failing any QC gate (`rainfall_total_years_below_min`, `rainfall_no_recent_data`, `rainfall_recent_years_sparse`, or `season_bound_discrepancies`) receive `draft: true`.
- **Public Tool Exclusion**: In `ClimateDataService.stations`, stations with `draft: true` or no climate data are strictly excluded from the active `stations()` signal, even when a custom deployment `station_filter` is defined. Public chart components and dropdowns derive strictly from `ClimateDataService.stations()`.
- **Admin Visibility**: The dashboard fetches stations directly from Supabase and shows all stations regardless of draft or QC status, using subtle non-alert styling (slate grey icons/badges, never red) for QC failures.

### Climate Quality Control & Data System Admin Conventions

- **Breaking Failures vs Non-Breaking Warnings**:
  - Only data availability gates (insufficient total years < 30, no recent data in past 10 years, sparse recent data < 10 years in past 30) constitute breaking QC failures (`ClimateQcFailure`).
  - Season bound discrepancies (e.g. years having Start but missing End or vice versa) are classified as non-breaking warnings (`ClimateQcWarning = "season_discrepancies"`). Stations with only season discrepancies pass quality control (`passed = true`, not drafted).
- **Google Material Icon Glyph Validation**:
  - The Material Icons font used by Angular Material does not contain the glyph `database`. Always verify icon names against standard Material Icons (the standard Data System / cloud DB icon in picsa-apps is `cloud`).
- **PicsaDataTable Context Binding**:
  - In `picsa-data-table`, value templates receive context `[ngTemplateOutletContext]="$any({ $implicit: row[column], row: row, column: column })"`.
  - The first implicit parameter receives `row[column]`. When defining custom templates that need object fields, use `let-row="row"`. For station names, provide a string column (e.g. `name`) rather than an object to avoid rendering `[object Object]`.

- **Data System Table Layout & QC Breakdown**:
  - The Data System admin table orders columns as: `name` (Station), `qc_passed` (QC Status icon), `rainfall_total_years`, `rainfall_last_thirty_years`, `rainfall_last_ten_years`, `qc_warnings` (Warnings), `products` (Available Products), `generation_timestamp` (Data Generated). Action columns are omitted.
  - Counters are color-coded: green (`text-emerald-700 font-semibold`) when meeting the check threshold, amber (`text-amber-700 font-semibold`) when failing.
  - Warnings are displayed on separate lines prefixed with a bullet point (`•`) in the table column.
  - Hovering the QC status icon displays a multi-line tooltip listing all verified quality control gates or specific failure reasons.
  - Clicking a station row opens `StationDetailsDialogComponent` as a modal dialog, allowing full inspection of Location, Data, Charts, and Crop Probabilities tabs without page navigation.
  - Material icon buttons in Angular 21 templates must use MDC directive syntax (`<button matIconButton>`), not legacy hyphenated attributes (`<button mat-icon-button>`).

---

## 5. Climate Data Quality Control & Sorting

### Quality Control Ranking Score & Sort Order

- **Formula (`calculateStationQcScore`)**:
  - `failuresCount > 0`: Score is negative count of failed gates (`-3` = failed all 3, `-2` = failed 2, `-1` = failed 1).
  - `failuresCount === 0`: Score is positive total rainfall observation years (e.g. `30`, `35`, `50+`).
- **Sorting Behavior (`MatTableDataSource`)**:
  - The default table sort on initial load is alphabetical by Station (`name`, `asc`). Users can manually click the "QC Status" column header to sort by `qc_score` (ascending places worst data at top: `-3` -> `-2` -> `-1` -> `30` -> `77`).
  - Column is labeled "QC Status" via `dbTableOptions.formatHeader`.
  - **Preventing Initial QC Re-Sort & Flash of Failure**: In `admin.component.ts`, `allStationData` and `allStationAppData` load asynchronously. `isDbLoading = computed(() => this.service.stations().length > 0 && this.allStationData() === undefined)`. Rendering tables before `allStationData` emitted evaluated stations against empty data (`evaluateStationQualityGates([])` -> `qc_score = -3`), flashing all stations as failed and triggering a jarring table re-sort when real data arrived. Gating the tables behind `@if (isDbLoading())` / `@if (isDiffLoading())` with `<mat-spinner>` ensures tables render only once with true QC scores in stable sorted order.
- **Rank Color Variations & Grouping Invariant**:
  - Color classes must be a strict, monotonic function of the sort key (`score`) to guarantee that all rows of the same rank remain strictly grouped in contiguous blocks without interleaving or alternating colors when sorted.
  - Failures (`cancel` icon): `-3` uses `text-rose-700`, `-2` uses `text-rose-500`, `-1` uses `text-amber-500` (lighter/paler shades).
  - Passes (`check_circle` icon): `< 40` total years uses `text-teal-500` (baseline / near-miss), `40..59` uses `text-emerald-500` (solid pass), `>= 60` uses `text-emerald-600` (deep historical pass, avoiding overly dark shades like `emerald-800`).
- **Season Boundary Discrepancies**:
  - Season discrepancies are non-breaking warnings (not breaking failures). 106 of 109 stations in the dataset have historical boundary discrepancies; they do not turn the pass mark amber, but are listed separately in the Warnings column and tooltip.
  - The "With Season Warnings" filter chip was removed as it matched virtually all stations, simplifying the filter options to Total, Passed, and Failed.

### Database Table Columns & Product Availability Matrix

- **Columns (`DB_DISPLAY_COLUMNS`)**:
  - `name`: Station Name
  - `qc_score`: QC Status (`check_circle` or `cancel`, sorted worst-to-best)
  - `rainfall_year_range`: Rainfall Date Range (`rainfallStartYear – rainfallEndYear` or `—`)
  - `rainfall_total_years`: Total observation years
  - `rainfall_last_thirty_years`: Recent 30 years count
  - `rainfall_last_ten_years`: Recent 10 years count
  - `qc_warnings`: Warnings (distinct entries for start-no-end and end-no-start)
  - `products`: Annual Products micro-matrix (`Products 🌧  🌡  🌾`)
  - `monthly_data`: Monthly Data micro-matrix (`Monthly 🌧  🌡`)
  - `generation_timestamp`: Data Generated date (formatted as YYYY-MM-DD or `—`)
- **Generation Metadata Consistency & Strict No-Fallback Rule**:
  - In both the Data System table and Station Details / Diff views, `generation_timestamp` represents the upstream calculation/generation date extracted from product metadata (`annual_rainfall_metadata`, `annual_temperature_metadata`, `crop_probability_metadata`, etc.).
  - **No Fallback to `updated_at`**: It must NEVER fall back to the database record's `updated_at`. When upstream generation metadata is absent or missing, display `—` rather than masking it with database synchronization timestamps.
  - The database sync timestamp (`updated_at`) and Generation ID are surfaced cleanly in the hover tooltip and the Station Details debug card for administrative inspection.
- **Micro-Matrix UI Pattern**:
  - Replaces bulky icon buttons with compact 16px indicators (`!text-[16px] !w-4 !h-4 leading-none`).
  - Available: `check` (`text-emerald-500`), Missing: `close` (`text-rose-500`).
  - Tooltips display individual item status, generation dates, and IDs.
- **Monthly Data Nuances**:
  - Supabase `climate_station_data` stores both `monthly_temperature_data` and `monthly_rainfall_data` (plus metadata), sourced from `/v2/monthly_temperature_summaries/` and `/v2/monthly_rainfall_summaries/` respectively. Monthly rainfall coverage is currently partial upstream (ZM returns data for many stations; MW/ZW may return empty arrays), so empty responses preserve existing DB rows and CSVs. The admin monthly micro-matrix reflects the presence of each column, and capabilities record `monthly: ['rainfall']` when a monthly CSV contains rainfall.

## PR Triage Workflow & Skill (`pr-triage`)

- **Skill Location**: `.agent/skills/pr-triage/` (symlinked via `.gemini/skills/pr-triage/`).
- **Core Script**: `.agent/skills/pr-triage/scripts/triage-prs.sh` (wraps `triage-prs.mjs`).
- **Cache Persistence & Anti-Duplication**:
  - Triage audits are cached at `.agent/pr-triage-cache.json` (gitignored).
  - Delta detection checks `headRefOid`. If unchanged, audits take < 1s without redundant GitHub API calls and report as `[cached]`.
  - Stale detection checks whether PR-Agent bot suggestions match the current branch HEAD SHA. If newer commits were pushed, suggestions are flagged as potentially addressed.
- **Default Window & Untriaged Backlog**:
  - Defaults to triaging the 5 most recently active open PRs.
  - Transparently lists the remaining untriaged PR backlog with age and author, providing one-shot prompts to drill down (`--prs <id>,<id>` or `--all`).
- **Senior Engineer Signals Surfaced**:
  - Merge Health: clean vs dirty (conflicted), behind by `N` commits, and auto-updatable via `PUT /repos/:owner/:repo/pulls/:id/update-branch`.
  - Gatekeeper status: CI build checks and SonarCloud Quality Gate passes/failures.
  - Sizing & Blast Radius: Noise-filtered churn (excludes CSVs, lockfiles, specs) mapped across monorepo boundaries (App Shell, Native, Backend, Tools) with `S/M/L/XL` effort sizing.
  - Actionable Verdict: `READY_FOR_REVIEW`, `BLOCKED_ON_AUTHOR`, `PENDING_BOT_FIXES`, `CONFLICTED`, `DRAFT`.

---

## 7. Header Theming & Cross-Host Tool Portals

### Unified Header Surface & Material Button Contract

- **The Problem (Primary vs Inverted & Farmer Mode)**:
  - In standalone/extension mode, `picsa-header` defaults to `data-style="primary"` (`background-color: var(--color-primary); color: white`).
  - When routed with `headerStyle: 'inverted'`, `picsa-header` uses a white background and primary text (`background-color: white; color: var(--color-primary)`).
  - In farmer nested tools, the global header is hidden (`hideHeader: true`) and `.tool-header` in `module-home.component` renders directly over the white page.
  - Angular Material M3 button directives (`matButton`, `matButton="outlined"`, `matIconButton`) and `mat-icon` enforce MDC internal theme variables rather than simply inheriting `currentColor`. Tool portals that hardcoded `text-white`, `bg-white/20`, `border-white/80`, and `[&_.mdc-button__label]:!text-white` worked on dark primary headers but became invisible white-on-white text in farmer mode and inverted routes.
- **The Solution (Header CSS Token Contract)**:
  - Both `picsa-header.component.scss` and `module-home.component.scss` (`.tool-header`) define unified surface tokens:
    - `--header-fg`: `white` (on primary) / `var(--color-primary)` (on inverted / farmer)
    - `--header-surface-bg`: `rgba(255, 255, 255, 0.18)` (on primary) / `color-mix(in srgb, var(--color-primary) 8%, transparent)` (on light)
    - `--header-surface-bg-hover`: `rgba(255, 255, 255, 0.28)` / `color-mix(in srgb, var(--color-primary) 14%, transparent)`
    - `--header-surface-border`: `rgba(255, 255, 255, 0.75)` / `color-mix(in srgb, var(--color-primary) 35%, transparent)`
    - Inherited Material tokens: `--mat-button-text-label-text-color: currentColor; --mat-button-outlined-label-text-color: currentColor; --mat-button-outlined-outline-color: var(--header-surface-border); --mat-icon-color: currentColor;`
  - Portal markup (`crop-probability`, `forecasts`, etc.) must use `bg-[var(--header-surface-bg)] hover:bg-[var(--header-surface-bg-hover)] border border-[var(--header-surface-border)]` and rely on inherited `currentColor` rather than hardcoding `text-white` or `color="primary"`.
- **`cdkPortalEnd` Outlet Parity in Farmer Mode**:
  - `module-home.component.html` (.tool-header) previously only outletted `headerContent()` (`cdkPortalCenter`), omitting `cdkPortalEnd`.
  - Adding `public headerEndContent = computed(() => this.componentsService.headerOptions().cdkPortalEnd)` and rendering `<ng-template [cdkPortalOutlet]="headerEndContent()"></ng-template>` in the right-aligned header slot ensures end-slot controls (such as the table image Share button in #784) render consistently in both standalone and farmer modes.
- **`@picsa/shared/features` Barrel Import Trap in Specs**:
  - The `@picsa/shared/features` barrel exports chart components which load `c3`. In Jest/JSDOM environments without full SVG/DOM globals, importing from `@picsa/shared/features` throws `TypeError: Cannot read properties of undefined (reading 'prototype')` during C3 initialization.
  - Deep-import feature modules directly (e.g. `import { PhotoListComponent } from '@picsa/shared/features/photo'`) to avoid loading C3 in unrelated component test suites.
