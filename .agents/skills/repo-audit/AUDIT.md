# Audit Report — PICSA Apps

> Generated with `.agents/skills/repo-audit/SKILL.md`. Do not commit unless asked.
> Author: `opencode-go/muse-spark-1.3-contributor` (initial draft, second-opinion assimilated by `opencode/deepseek-v4.1-flash-free`); restructured to updated template + stack/dependency census by `gemini-4-hydrogen` (T3 Code / Antigravity).
> Date: 2026-11-13. Base commit: `3d2fa9e467ef9171de415caec449caeca5c5dbbd`. Scope: full repo (apps/ + libs/ + Supabase + scripts + CI).
> Context: `repo-context.md` filled — archetypes, focus areas, audit path, and known pain used directly; no invented users.
> Previous audit: none (this is the baseline).
> Second opinion: `gemini-4-hydrogen` (T3 Code / Antigravity), one pass, 2026-11-13 — 5/5 top claims Agree, 5 gap candidates all added as F34–F38 after the author re-read each cited file.

## Top summary

**Highest-leverage recommendation:**

- Fix `F26`/`F34` first (auth-gate `dashboard/deployments/notify-requests`, escape template variables, and validate `request_message` at the DB): it is the only unauthenticated path that sends mail as the project, one function + one migration, and it removes the abuse vector before any public promotion. Then fix `F25` (scope storage writes to `authenticated` + country-role) so synced PDFs/covers farmers open cannot be replaced by anon clients.

**Priority issues (ordered by value relative to effort):**

| Rank | ID | Sev | Tier | V/E | Title | Location | Impact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | F26, F34 | P0 | CONFIRMED | H/S | Unauthenticated deployment email relay + raw HTML injection | `dashboard/deployments/notify-requests.ts:30-136`, `_shared/template.ts:9-12` | Any anon-key caller can forge HTML emails from the project |
| 2 | F25 | P0 | CONFIRMED | H/S | Anonymous world-writable Supabase storage buckets | `migrations/20261012000000_zw_storage_bucket.sql:15-29` | Any internet client can INSERT/UPDATE/DELETE live PDFs and covers |
| 3 | F30 | P0 | CONFIRMED | H/M | CI runs `lint` + `build` with `nx test` commented out | `.github/workflows/build-test.yml:58-65` | Failing specs merge silently; local `ai:*` differs from CI |
| 4 | F1 | P0 | CONFIRMED | H/S | Nx module boundaries are warn-only wildcards with empty tags | `.eslintrc.json:9-26` | `libs/`→`apps/` dependency inversions merge silently |
| 5 | F6 | P0 | CONFIRMED | H/M | Climate sync computes hash/`lastUpdated` 3 ways by mode | `sync-climate-data.ts:878,1055,1318-1321` | Same CSVs flip NEW/UPDATED/UNCHANGED; audit log untrusted |
| 6 | F35 | P1 | CONFIRMED | H/S | `budget/share.ts` upserts with `service_role` on caller `share_code` | `supabase/functions/budget/share.ts:14-29` | Any anon caller can overwrite another user's shared budget |
| 7 | F10 | P1 | CONFIRMED | H/S | Lazy CSV failures resolve to `[]` and cache permanently | `libs/utils/data.ts:143-146` | Flaky network renders blank climate charts with no retry |
| 8 | F19, F36 | P1 | CONFIRMED | H/M | Download `unregister()` leaks and `cancel()` deadlocks `PQueue` | `resources-download.service.ts:84-120,211-222` | Cancelling item 1 stalls the download queue indefinitely |

**Structural / maintainability themes (1–3):**

| Theme | Spread (census) | Long-term drag | Phase-1 containment |
| --- | --- | --- | --- |
| Dual backends & triple local persistence wired at app root | `supabase` (121 files) vs `firebase/firestore` (`_server.db.ts`) + `dexie` (2 files) + `rxdb-14` (9 hits) + `rxdb` v16 (58 files), booted together in `app.config.ts:31-32` | Doubles migration/sync surface, keeps `firebase@9` + `dexie` in farmer bundle, and confuses agents over canonical DB | R18 (`F4`) — quarantine/remove `PicsaDbModule` from `app.config.ts` & extract `generateID` |
| Unfinished MobX + `NgModule` migration & mixed Angular APIs | `budget-tool` holds all `18` `standalone: false` components + `MobxAngularModule` (`app.config.ts:11`); `28` `@NgModule`, `35` `@Input` vs `149` `input()` | Forces `MobxAngularModule` at root and creates copy-trap examples that violate `angular/SKILL.md` | R19 (`F39`) — isolate `MobxAngularModule` to `budget-tool` routes & lint-ban new `@Input`/`standalone: false` |
| Dead/duplicate `package.json` weight + `libs/`→`apps/` boundary inversions | `parse`, `puppeteer`, `@nx/nest`, `jest-jasmine2`, `jest-circus` (0 source hits); dual `xlsx`/`exceljs`; `10` `libs/`→`apps/` imports (`F2`) | Bloats install/bundles, locks upgrades, and breaks Nx project graph isolation | R5, R6, R20 (`F1`, `F2`, `F5`, `F40`) — prune dead deps & enforce `error` Nx tags |

**Strengths (7):**

| Strength | Evidence |
| --- | --- |
| Climate sync hashes content (SHA-256) and types capabilities over free-form overrides | `apps/picsa-scripts/src/climate/sync-climate-data.ts:878`, `libs/utils/climate.utils.ts:985-996` |
| Zero-dependency local verify scripts (`ai:lint`, `ai:test`, `ai:typecheck`) with `--dry-run`/`--help` | `tools/ai/ai-lint.mjs:1-40`, `tools/ai/ai-test.mjs:1-60`, `tools/ai/ai-typecheck.mjs:1-19` |
| Offline-first persistence (RxDB v16 + Dexie) with attachment URI read-path decoupled from binary storage | `libs/shared/src/services/core/db_v2/db.service.ts:12-17`, `libs/shared/src/services/core/db_v2/db-attachment.service.ts:141` |
| i18n coverage across 20+ locale assets with generation + spellcheck pipeline | `libs/i18n/assets/`, `package.json:22` (`i18n:gen`) |
| Dashboard climate diff preview with overlaid C3 charts per station/product | `apps/picsa-apps/dashboard/src/app/modules/climate/pages/admin/components/station-diff-dialog/station-diff-dialog.component.html:163-174` |
| Unit-test colocation next to source enforced by convention | `libs/utils/climate.utils.spec.ts` next to `libs/utils/climate.utils.ts` |
| Worktree-aware setup (copies env/config, shortens Nx socket path) and Capacitor plugin-allowlist comment | `tools/ai/ai-worktree-setup.mjs:33-40`, `apps/picsa-apps/app-native/capacitor.config.ts:9-11` |

## Roadmap (single source — ordered by priority)

Value `H/M/L`: `H` removes a crash, data loss, or primary-user blocker **or** eliminates major long-term maintenance / mental-model drag (competing stacks, systemic leakage, contributor/AI traps); `M` clears subset pain or meaningful toil / cognitive load; `L` is nice-to-have.
Effort `S/M/L` (never days): `S` likely one file + covered tests; `M` a few files or extra review; `L` many files or heavy human oversight. Every `P0`/`P1` finding (including `Effort L` consolidation items) maps to a row below.

| ID | Type | Title | Beneficiary | Value | Effort | Depends on | Done when | From |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R13 | security | Auth-gate deployment email relay + escape template variables | org (mail reputation), admin | H | S | none | anon key cannot send mail; `request_message` HTML is escaped | F26, F34 |
| R1 | security | Scope storage bucket writes to authenticated + country role | farmer (served PDFs are trustworthy) | H | S | none | anon INSERT/UPDATE/DELETE rejected; existing objects audited | F25 |
| R14 | security | Require ownership before budget share upsert | budget-tool users | H | S | none | caller cannot overwrite an existing `share_code` they do not own | F35 |
| R5 | boundary | Enforce Nx tags (`error`) and assign `scope:*` tags | contributor | H | S | none | libs→apps import fails lint; CI red | F1 |
| R3 | reliability | Surface CSV load errors with retry instead of caching `[]` | farmer | H | S | none | failed monthly fetch shows error + retry; no silent blank chart | F10 |
| R4 | reliability | Unsubscribe in `unregister()` + keep `cancel()` semantics | farmer | H | S | none | navigating away cancels bytes; no post-unregister attachment write | F19 |
| R15 | reliability | Settle the download promise on cancel (unblock `PQueue`) | farmer | H | S | R4 | cancelling item 1 lets item 2 start; double-tap does not leak | F36 |
| R9 | UX | Inline download error + retry; distinct from ready | farmer | H | S | none | failed resource shows "failed — tap to retry" inline | F16 |
| R7 | CI | Add PR-gated android debug build + `cap ls` assertion | contributor | H | S | none | web-green PR cannot merge with broken native shell | F8 |
| R12 | docs | Fix README quickstart + AGENTS verify table + typecheck stanza | contributor | H | S | none | fresh clone follows 5 verbatim lines to running verify | F28, F29, F31 |
| R20 | deps | Remove dead deps (`parse`, `puppeteer`, `@nx/nest`, `jest-*`) + move script deps to `devDependencies` + pick 1 Excel engine | contributor, farmer | H | S | none | `parse`/unused deps deleted, `sharp`/`@nx/angular` in devDeps, single xlsx lib | F5, F40 |
| R23 | UX | Surface bundled-data `lastUpdated` on climate station-card/site-view | extension officer | H | S | none | field users see data freshness date per station | F9 |
| R25 | correctness | Gate 3-month climate aggregation on >=1 non-null + document temp semantics | extension officer | H | S | none | all-null seasons omitted; partial-month temp logic documented | F18 |
| R26 | AI-workflow | Warn on credential copy in `ai-worktree-setup` + add `--staged` mode to `ai:*` | contributor | H | S | none | setup logs redaction reminder; `ai:lint`/`test`/`typecheck` support `--staged` | F33 |
| R16 | correctness | Preserve legitimate 0 mm annual rainfall rows | farmer | M | S | none | a 0 mm year renders as 0, not missing | F37 |
| R2 | correctness | Single climate hash + `lastUpdated` resolver for all sync modes | dashboard admin | H | M | none | `--pull`, `--no-pull`, `--input` agree on NEW/UPDATED/UNCHANGED; covered by test | F6 |
| R6 | boundary | Extract tool schemas from `apps/` into `libs/models` or `libs/data` | contributor | H | M | R5 | libs build without `apps/`; migration + `i18n-gen` import from `libs/` | F2 |
| R8 | CI | Document or automate `ai:*` ↔ `yarn lint`/`test` parity | contributor | H | M | none | agent-green equals CI-green for scoped changes | F30 |
| R10 | UX | Approve-and-bundle action in diff dialog + monthly coverage label | dashboard admin | H | M | R2 | admin can commit from preview; dialog states annual-only until monthly lands | F12, F13 |
| R11 | reliability | Range-resume + size guard for resource downloads | farmer | H | M | R4 | large video resumes after drop; oversize blocked pre-flight | F22 |
| R17 | correctness | Make climate CLI auth work with `sb_secret_` keys | dashboard admin | H | M | R2 | CLI sync succeeds with either key type without manual env hand-switching | F38 |
| R21 | performance | Lazy-load heavy chart/map entrypoints + verify via `build:stats` | farmer | H | M | R6 | `c3`/`maplibre-gl` split out of initial native chunk | F3 |
| R24 | UX | Add bulk on-demand sync/health-check endpoint in `dashboard/climate` | dashboard admin | M | M | R17 | single edge-function call refreshes/checks selected stations | F14 |
| R22 | maintenance | Upgrade EOL `date-fns` v2 and `eslint` v8 after CI test gate | contributor | M | M | R8 | `date-fns` & `eslint` on supported majors with green CI tests | F7 |
| R18 | architecture | Phase-1 persistence consolidation: isolate `generateID`, remove `PicsaDbModule` (Firestore/Dexie) from root `app.config.ts` | contributor, farmer | H | L | none | `db/` + `firebase/firestore` + `dexie` disconnected from app boot; `db_v2` documented canonical | F4 |
| R19 | architecture | Phase-1 Angular/state parity: move `MobxAngularModule` out of `app.config.ts` + enforce `standalone`/`input()` lint rule | contributor | H | L | none | `app.config.ts` has no `MobxAngularModule`; ESLint blocks new `@Input`/`standalone: false` | F39 |

- **Quick wins:** R1, R3, R4, R5, R7, R9, R12, R13, R14, R15, R16, R20, R23, R25, R26
- **Strategic (with Phase-1 steps):** R2, R6, R8, R10, R11, R17, R18, R19, R21, R22, R24

**Strategic notes:**

| ID | What breaks / drags today | What it unblocks | Cost of deferral |
| --- | --- | --- | --- |
| R2 | Admins cannot trust UNCHANGED/audit log; sync-date visibility builds on sand | Diff preview, monthly rollout, `#694` normalization | Every sync adds more untrusted history |
| R6 | Any lib change drags full apps into build/test | Nx caching, focused CI, safe AI refactors | `F1` enforcement red-flags the tree without a migration path |
| R8 | AI PRs flip between local-green and CI-red | Trustworthy agent cadence | Each AI PR pays a full lint+build cycle to learn the gap |
| R10 | Approval happens outside the tool that shows the diff | Approve-and-commit loop | Monthly regressions (`F12`) ship even after preview |
| R11 | Rural drops restart 20–120 MB videos from zero (`#888`) | Resumable-downloader plugin work | Farmers pay data costs per retry |
| R17 | Configured `SUPABASE_REMOTE_SECRET_KEY` breaks climate CLI sync against edge function | Unattended sync/health-check automation (`F14`, `R24`) | Admins hand-edit env vars before each sync |
| R18 | Legacy Firestore + Dexie (`PicsaDbModule`) + `rxdb-14` live alongside `db_v2` RxDB v16 in root providers | Removing `firebase@9` + `dexie`, shrinking farmer bundle and migration matrix | Every DB/sync change carries triple-stack confusion and dead bundle weight |
| R19 | `MobxAngularModule` in `app.config.ts` + 18 `standalone: false` / 28 `@NgModule`s create mixed mental models | Pure Signals/RxJS + standalone Angular 21 architecture matching `angular/SKILL.md` | Agents and contributors keep copying legacy patterns into new features |
| R21 | Heavy `c3` / `maplibre-gl` imports in shared libs inflate initial native bundle | Faster cold boot and smaller updates on budget Android | Every release ships unused tool weight eagerly |
| R22 | EOL `eslint@8` and `date-fns@2` block downstream tooling upgrades | Modern ESLint flat config (`@nx/eslint`) and current date-fns | Upgrade debt compounds while lint/test rules lag |
| R24 | Dashboard admins refresh climate stations sequentially from the client | One-click multi-station sync and health check | Large country syncs remain slow and fragile |

### Task prompts

| ID | Agent handoff prompt |
| --- | --- |
| R1 | "In `apps/picsa-server/supabase/migrations/` add a migration replacing `TO public` storage write policies with `authenticated` + country-role checks (see F25), then verify anon INSERT is rejected." |
| R2 | "In `apps/picsa-scripts/src/climate/sync-climate-data.ts` extract one `computeStationHash(annual,monthly)` + one `lastUpdated` resolver used by all three sync paths (F6) with a unit test locking NEW/UPDATED/UNCHANGED." |
| R3 | "In `libs/utils/data.ts:137-150` and `climate-data.service.ts:132-142` propagate CSV load errors to an error state with retry instead of `resolve([])` (F10)." |
| R4 | "In `apps/picsa-tools/resources-tool/src/app/services/resources-download.service.ts:108-120` unsubscribe the in-flight subscription inside `unregister()` (F19) and cover with a spec." |
| R5 | "In `.eslintrc.json:9-26` assign `scope:*` tags and switch `@nx/enforce-module-boundaries` to `error` with app→lib constraints (F1)." |
| R6 | "Move resource/budget/option schemas referenced in F2 from `apps/picsa-tools/*/src/app/...` to `libs/models` (or `libs/data`) and repoint `tsconfig.base.json:25-45` + `libs/data`, `libs/migrations`, `libs/i18n-gen` imports." |
| R7 | "In `.github/workflows/` add a PR-gated `android-build` (debug) job and assert `npx cap ls` matches `capacitor.config.ts:11-37` (F8)." |
| R8 | "Add a CI job running `node tools/ai/ai-lint.mjs --check --dry-run` (and `ai:test`/`ai:typecheck` parity) or document the `yarn lint` pre-push gate (F30)." |
| R9 | "In `resource-download.component.html:1-17` render a distinct error state with inline 'tap to retry' separate from `ready` (F16)." |
| R10 | "In `station-diff-dialog.component.html:265-267` add approve-and-bundle committing the previewed sync and label monthly-blindness from F12." |
| R11 | "In `libs/shared/src/services/core/file.service.ts:53-113` add `Range`-resume with persisted progress and a pre-download size guard (F22)." |
| R12 | "Patch `README.md:16-20` to a verbatim install/verify block and add an Install\|Verify\|Format\|PR table + `ai:typecheck` stanza to `AGENTS.md:62-78` (F28, F29, F31, F41)." |
| R13 | "In `apps/picsa-server/supabase/functions/dashboard/index.ts:41-42` require a service JWT/webhook secret before `deployments`, and HTML-escape `request_message`/`response_message` in `notify-requests.ts:94,116-134` (F26, F34)." |
| R14 | "In `apps/picsa-server/supabase/functions/budget/share.ts:14-29` authenticate the caller and verify ownership before upserting a caller-supplied `share_code` (F35)." |
| R15 | "In `apps/picsa-tools/resources-tool/src/app/services/resources-download.service.ts:211-222` reject/complete the `download()` promise on cancel so `PQueue` continues, and guard the finalizing window (F36)." |
| R16 | "In `apps/picsa-tools/climate-tool/src/app/services/climate-data.service.ts:202-231` stop converting rainfall `'0'` to null so 0 mm years render correctly (F37)." |
| R17 | "In `apps/picsa-scripts/src/climate/sync-climate-data.ts:425` and `apps/picsa-server/supabase/functions/_shared/auth.ts:39-41` make CLI auth accept the configured key type (or sign a service JWT) and add a contract test (F38)." |
| R18 | "Phase-1 DB consolidation (F4): move `generateID` out of `libs/shared/src/services/core/db/db.service.ts` to `libs/utils`, verify whether `PicsaDbModule` (`app.config.ts:31`, `budget-tool.components.ts:62`) has any live runtime readers, and remove Firestore/Dexie from `app.config.ts`." |
| R19 | "Phase-1 Angular/state containment (F39): scope `MobxAngularModule` from `apps/picsa-apps/app/src/app/app.config.ts:11,30` down to `budget-tool` routes only and add ESLint rules blocking new `standalone: false` / `@Input()` / `@Output()`." |
| R20 | "In `package.json:52-225` remove dead deps (`parse`, `@types/parse`, `puppeteer`, `@nx/nest`, `jest-jasmine2`, `jest-circus`), move `sharp`/`@nx/angular` to `devDependencies`, and consolidate `xlsx`/`exceljs` (F5, F40)." |
| R21 | "Convert `libs/shared/src/features/charts/chart.ts:15` and `libs/shared/src/features/map/map.ts:20` to lazy secondary entrypoints/dynamic `import()` and verify bundle reduction with `yarn build:stats` (F3)." |
| R22 | "After CI tests are gated (`R8`), upgrade `date-fns` (`package.json:93`) and `eslint` (`package.json:187`) to supported majors (F7)." |
| R23 | "In `apps/picsa-tools/climate-tool/src/app/pages/site-select/components/station-card/station-card.component.ts:38-61` display the bundled station `lastUpdated` date (F9)." |
| R24 | "In `apps/picsa-server/supabase/functions/dashboard/climate/index.ts:65-317` and `admin.component.ts:615-624` add a bulk climate sync/health-check action (F14)." |
| R25 | "In `libs/utils/climate.utils.ts:985-1053` skip emitting all-null 3-month season rows and document partial-month temperature aggregation semantics in chart definitions (F18)." |
| R26 | "In `tools/ai/ai-worktree-setup.mjs:33-40` log a credential-copy security reminder and in `tools/ai/_shared.mjs:41-48` add `--staged` support so dirty data files do not pollute `ai:*` runs (F33)." |

## Delta since last audit

- Summary: `No previous audit — this is the baseline.` New in this audit: 41 findings (`F1–F38` from initial audit + second opinion, plus `F39–F41` added during template restructuring & stack/dependency census).

| Prior finding | Status | Evidence |
| --- | --- | --- |
| — | — | No prior committed `AUDIT.md`; baseline created on 2026-11-13 |

## Scope and coverage

| Area / Surface | Status | Notes / Skip reason |
| --- | --- | --- |
| `apps/picsa-tools/{climate,resources,forecasts}-tool` | Read | Primary field tools + data/download services |
| `apps/picsa-tools/budget-tool` & `libs/shared/src/services/core/db*` | Census + targeted reads | Added in restructuring (`app.config.ts`, `db.module.ts`, `budget.service.ts`) |
| `apps/picsa-apps/dashboard/src/app/modules/{climate,auth,map}` | Read | Admin preview, auth guards, map |
| `apps/picsa-scripts/src/climate` | Read | Climate sync pipeline & hash modes |
| `apps/picsa-server/supabase/{migrations,functions}` | Read | RLS, storage policies, edge functions |
| `libs/{utils,data,models,shared,migrations,i18n}`, `tools/ai`, `.github/workflows` | Read | Core libs, migrations, AI verify scripts, CI |
| Root configs (`package.json`, `nx.json`, `tsconfig.base.json`, `.eslintrc.json`, `AGENTS.md`, `TODO.md`) | Read | Manifest census, boundaries, docs |
| `dist/`, `build/`, `node_modules`, `yarn.lock`, `app-native/android/` build outputs, climate CSV values | Skipped | Out of scope per `repo-context.md`; tracked `git grep` used to avoid build-dir noise |

- **Commands & checks:** `git rev-parse HEAD` → `3d2fa9e46`; `git status --porcelain` → 3 modified data files; `git log` churn top (`AI_GENERATED_KNOWLEDGE.md` 36, `package.json` 26); `gh issue list --limit 30` → #888, #875, #713, #767; `git grep` stack/dependency/security census (outputs in Appendix).
- **Issues mined (read-only):** recurring asks are offline resource sharing (#498/#561), climate audit/admin UX (#713/#694/#377), download resilience (#888), dashboard compression limits (#875/#884).
- **Assumptions:** none material — `repo-context.md` was filled; archetype wording reused verbatim. Temp partial-month aggregation semantics taken from `climate.utils.ts` docstring as intended.

## User impact and functionality

| Archetype | Goal | Constraint | What "broken" means |
| --- | --- | --- | --- |
| Extension officer / farmer | Run PICSA tools reliably offline on budget Android | Low connectivity, metered data, limited storage | Stale/wrong climate charts, failed syncs with no recourse, bloated bundles, broken build |
| Dashboard admin | Curate climate datasets & resources safely | No silent regressions across countries/stations | Silent data regressions, no diff preview before commit, unclear sync provenance |
| Contributor / maintainer | Ship safely across `apps/` and `libs/` | High AI-assisted change cadence | Competing backends/state/storage layers, unclear canonical paths, CI missing tests |

**Gap findings (missing, painful, or mismatched):**

| ID | Sev | Tier | V/E | Title | Location | User impact | Next step |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F9 | P1 | CONFIRMED | H/S | No bundled-data date visible to field user | `climate-tool/.../station-card.component.ts:38-61`, `admin.component.ts:497-519` | Extension officer cannot tell stale vs fresh station data | Surface bundled-data date on station-card/site-view |
| F10 | P1 | CONFIRMED | H/S | Lazy CSV failures cached as empty | `libs/utils/data.ts:143-146`, `climate-data.service.ts:132-142`, `climate-chart.service.ts:62-68` | Flaky fetch looks like "no data" forever until reload | Propagate error state with retry instead of `resolve([])` |
| F11 | P2 | LIKELY | M/S | Capability guard hides timespan without explanation | `climate-chart.service.ts:83-89,172-179` | Users cannot tell why a timespan option is absent | Add one-line disabled-reason in timespan-selector |
| F12 | P1 | CONFIRMED | H/M | Diff preview blind to monthly data | `climate-diff.types.ts:12-19`, `admin.component.ts:127-128`, `TODO.md:16` | Admins miss monthly regressions during diff review | Extend diff to monthly products or label "annual only" |
| F13 | P1 | CONFIRMED | H/M | Diff dialog preview-only, no approve/commit | `station-diff-dialog.component.html:265-267` | Approval must happen outside the tool showing the diff | Wire approve-and-bundle action |
| F14 | P1 | LIKELY | M/M | No on-demand sync endpoint; sequential client refresh | `TODO.md:17`, `functions/dashboard/climate/index.ts:65-317`, `admin.component.ts:615-624` | Slow manual admin station refresh | Add bulk edge-function action |
| F15 | P2 | CONFIRMED | M/S | `override_data` TODO stale | `TODO.md:14`, `migrations/20260910000000_drop_crop_override_data.sql:1-2` | Misleads contributors into hunting deleted column | Check off / reword `TODO.md:14` |
| F16 | P1 | CONFIRMED | H/S | Download failure looks identical to ready | `resource-download.component.html:1-17`, `resources-download.service.ts:158-161,204-208` | Farmers tap a broken resource thinking it is ready | Render distinct error affordance with inline retry |
| F17 | P2 | CONFIRMED | M/S | Geolocation failure silent | `site-select.page.ts:587-592` (`console.warn` only) | Officer sees no feedback when GPS fails | Show toast/hint with manual-pick guidance |
| F18 | P1 | LIKELY | H/S | 3-month aggregation emits all-null rows; temp semantics undocumented | `libs/utils/climate.utils.ts:985-996,1008-1053` | Empty season rows and unclear partial-month averages | Gate emission on ≥1 non-null value; document temp semantics |

## Architecture & dependencies

**Stack & migration inventory (competing paradigms):**

| Concern | Canonical | Legacy / Competing | Census (files / refs) | Contained or leaking? |
| --- | --- | --- | --- | --- |
| Server backend & telemetry | Supabase (`@supabase/supabase-js`) + `@capacitor-firebase/*` telemetry | `firebase/firestore` (`_server.db.ts`) + `firebase` v9 (`firebase.service.ts`) + `parse` in `package.json` | Supabase `121` TS files; `firebase/firestore` `1` file (`db.module.ts:16`); `parse` `0` imports | **Leaking** — `PicsaDbModule.forRoot()` booted in `app.config.ts:31` |
| Client offline DB | `db_v2` (RxDB v16 + Dexie storage) | `db/` (`DBCacheService` Dexie + `DBServerService`) + `rxdb-14` migration | `db_v2` `33` TS files; `db/` `12` files (`generateID` in 5 tools); `dexie` `2` direct files; `rxdb-14` `9` hits | **Leaking** — `PicsaDbModule` booted at root; `generateID` imported across 5 tools |
| State management | Angular Signals + RxJS | `mobx` / `mobx-angular` | `signal`/`computed` `618` hits; `mobx` `6` TS files (`budget-tool` + `app.config.ts`) | **Leaking** — `MobxAngularModule` imported at root `app.config.ts:11,30` |
| Angular components & APIs | Standalone components + `input()`/`output()` + `@if`/`@for` | `NgModule` + `standalone: false` + `@Input`/`@Output` + `*ngIf`/`*ngFor` | `221` `@Component` (`18` `standalone: false`, all in `budget-tool`), `28` `@NgModule`; `149` `input()` vs `35` `@Input`; `32` `output()` vs `11` `@Output`; `547` `@if`/`@for` vs `1` `*ngIf`/`*ngFor` | **Contained-ish (one tool for `standalone: false`) / Leaking** (`28` `@NgModule`s and `35` `@Input`s spread across apps/libs) |
| Spreadsheet export | One engine (TBD: `exceljs` or `xlsx`) | `xlsx@0.18.5` + `exceljs@4.4.0` | `xlsx` `2` files (`libs/utils/xlsx.ts:1`); `exceljs` `2` files (`translations-xlsx-export.service.ts:4`) | **Unconsolidated** — both in root `dependencies` |

**Dependency & manifest health (`package.json`):**

| Package / Manifest | Issue | Evidence (imports / version) | Concrete cost | Next step |
| --- | --- | --- | --- | --- |
| `parse@3.4.2`, `@types/parse` | Dead | `package.json:119,168`; `0` tracked source imports | Misleads backend identity; install/audit noise | Remove from `package.json` |
| `puppeteer@15.5.0`, `@nx/nest@22.3.3`, `jest-jasmine2@30.0.5`, `jest-circus@^29.5.0` | Dead / stale test runner | `package.json:153,196,200,215`; `0` tracked source imports | Heavy transitive install (Chromium/Nest) + jest 29/30 skew | Remove from `devDependencies` |
| `sharp@^0.33.5`, `@nx/angular@22.3.3` | Misplaced in `dependencies` | `package.json:76,124`; `sharp` only in `apps/picsa-scripts/src/media/image-optimizer.ts:1` | Native/Nx tooling in runtime `dependencies` block | Move to `devDependencies` |
| `xlsx@0.18.5` + `exceljs@4.4.0` | Duplicate + unmaintained CVE risk | `package.json:98,130`; `libs/utils/xlsx.ts:1` vs `translations-xlsx-export.service.ts:4` | Ships two spreadsheet engines; `xlsx@0.18.5` unmaintained on npm | Standardise on one engine |
| `firebase@^9.16.0`, `dexie@^3.2.3`, `mobx-angular@^4.8.0`, `rxdb-14` | Legacy stack weight | `package.json:95,111-112,122`; `db.module.ts:16`, `app.config.ts:11,31` | Dual DB + MobX wired into farmer app bundle | Isolate/retire via R18, R19 |
| `date-fns@^2.29.3`, `eslint@8.57.0`, `tailwindcss@^3.4.13` | Outdated / EOL | `package.json:93,187,219` | `eslint` 8 EOL; `date-fns` v2 EOL | Re-enable CI tests (`F30`) before major bumps |

**Architecture findings:**

| ID | Sev | Tier | V/E | Title | Location | System / maintainability impact | Next step |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F1 | P0 | CONFIRMED | H/S | Nx module boundaries unenforced | `.eslintrc.json:9-26`, `libs/{data,shared}/project.json:6`, `climate-tool/project.json:7` | `warn` + `* → *` lets `F2` inversions pass CI | Assign `scope:*` tags; switch rule to `error` |
| F2 | P0 | CONFIRMED | H/M | Inverted `libs/`→`apps/` imports | `tsconfig.base.json:25-45`, `libs/data/climate/resources/zm.ts:1`, `rxdb-14.migration.ts:2-7`, `i18n-gen/src/hardcoded/budget.ts:2` | `libs/` unbuildable without `apps/`; breaks Nx caching | Extract schemas to `libs/models` or `libs/data` |
| F3 | P1 | CONFIRMED | H/M | Flat root deps bundle heavy libs into native app | `package.json:87-131`, `charts/chart.ts:15`, `map/map.ts:20`, `capacitor.config.ts:7` | Metered-device bundle bloat for unused tools | Lazy secondary entrypoints + dynamic `import()`, verify `build:stats` |
| F4 | P1 | CONFIRMED | H/L | Dual backends + triple client persistence wired at root | `app.config.ts:31`, `db.module.ts:16`, `_server.db.ts:14`, `db_v2/db.service.ts:12-17`, `rxdb-14.migration.ts:9-14`, `_cache.db.ts:4` | Doubles sync-failure surface and agent confusion | Phase 1: decouple `generateID`, drop `PicsaDbModule` from root |
| F5 | P1 | CONFIRMED | M/S | Duplicate spreadsheet engines (`xlsx` + `exceljs`) | `package.json:98,130`, `libs/utils/xlsx.ts:1`, `translations-xlsx-export.service.ts:4` | Two XLSX stacks maintained; `xlsx@0.18.5` unmaintained | Standardise on one engine and remove the other |
| F6 | P0 | CONFIRMED | H/M | Climate hash/`lastUpdated` diverge across 3 modes | `sync-climate-data.ts:878,1055,1318-1321`, `:885-887,1059-1062,1330` | Same CSVs flip NEW/UPDATED/UNCHANGED; audit log untrusted | Extract single `computeStationHash` + `lastUpdated` resolver |
| F7 | P1 | CONFIRMED | M/M | Stale peripherals with no CI test gate | `package.json:93,100,187,219`, `build-test.yml:58-65` | Upgrades unsafe without automated test coverage | Re-enable affected tests + `ai:typecheck` first |
| F8 | P1 | CONFIRMED | H/S | Native health not PR-gated; plugins hand-listed | `android-e2e.yml:7-10`, `build-test.yml:1-14`, `capacitor.config.ts:11-37` | Web-green PRs can ship broken Android native shell | Add PR-gated debug build + `npx cap ls` check |
| F39 | P1 | CONFIRMED | H/L | Unfinished MobX/`NgModule` migration leaks to app root | `app.config.ts:11,30`, `budget.service.ts:10`, `budget-tool` (`18` `standalone: false`), `28` `@NgModule`s | Forces root MobX provider + creates mixed mental models | Scope `MobxAngularModule` to `budget-tool`; ESLint-ban legacy patterns |
| F40 | P1 | CONFIRMED | H/S | Dead (`parse`, `puppeteer`, `@nx/nest`, `jest-*`) & misplaced (`sharp`, `@nx/angular`) deps | `package.json:76,119,124,153,196,200,215` | Dead install weight, runtime/dev blurred, false backend signals | Prune dead deps and move script/CLI tooling to `devDependencies` |

## Maintainability & system understanding

**Declared rules vs codebase reality:**

| Standard / Doc | Declared target | Actual split (census) | Copy-trap / comprehension risk |
| --- | --- | --- | --- |
| `angular/SKILL.md:10-40,73-85` | Signals (`input()`/`output()`), standalone, `@if`/`@for` | `149` `input()` vs `35` `@Input`; `221` `@Component` (`18` `standalone: false` in `budget-tool`); `28` `@NgModule` | Contributors copying `budget-tool` or older `libs/` modules propagate `NgModule` / `@Input()` |
| `.agents/rules/tech-stack.md:25-38` | Supabase primary, RxDB/Dexie offline, Signals/RxJS (MobX legacy) | `MobxAngularModule` + `PicsaDbModule` (Firestore+Dexie) + `PicsaDb_V2_Module` all loaded at `app.config.ts:30-32` | Root `app.config.ts` makes legacy MobX and Firestore look active/canonical |
| `README.md`, `AGENTS.md:5`, `tech-stack.md:7` | Accurate onboarding & stack versions | `README.md` lists Parse links; `AGENTS.md:5` & `tech-stack.md:7` say Capacitor 7 (code is `^8.0.0`) | Agents/devs misread backend & Capacitor major version; `AI_GENERATED_KNOWLEDGE.md` repeats gotchas 4× |

**Maintainability findings:**

| ID | Sev | Tier | V/E | Title | Location | Maintainability / onboarding impact | Next step |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F41 | P2 | CONFIRMED | M/S | Docs & agent rules drift on Capacitor 8, Parse, and duplicate knowledge | `README.md:30-35`, `AGENTS.md:5`, `.agents/rules/tech-stack.md:7`, `.agents/AI_GENERATED_KNOWLEDGE.md:25,73,713,785` | New contributors & agents start with wrong backend/Capacitor mental model | Update Capacitor 7→8, drop Parse links, deduplicate knowledge notes |

- **Grouped style note (at most one):** Flat early-return style is generally followed in audited services; systemic smells are architectural (`F2`, `F4`, `F39`, `F40`), not formatting nits.

## Bugs

| ID | Sev | Tier | V/E | Title | Location | Observed behaviour & impact | Next step |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F19 | P1 | CONFIRMED | H/S | `unregister()` leaks in-flight download | `resources-download.service.ts:108-120,134-140,163-179` | Drops map entry without unsubscribing; wastes metered bandwidth & writes attachment | Unsubscribe inside `unregister()` |
| F36 | P1 | CONFIRMED | H/M | `cancel()` deadlocks `PQueue` and races `finalizing` | `resources-download.service.ts:84-105,135,142,168-179,211-222` | Unsubscribes HTTP without settling `download()` promise; stalls `concurrency=1` queue | Reject/complete promise on cancel; guard `finalizing` |
| F37 | P2 | CONFIRMED | M/S | Zero-rainfall years wiped as missing | `climate-data.service.ts:202-211,226-231` | `'0'` mapped to `null` then nulls row when `!Rainfall`; 0 mm years vanish | Only null non-rainfall `'0'` or explicit null strings |
| F38 | P1 | LIKELY | H/M | Climate CLI prefers opaque `sb_secret_` key that auth cannot decode | `sync-climate-data.ts:425,604`, `functions/_shared/auth.ts:39-41` | Unconditional `djwt.decode()` throws 500 when `SUPABASE_REMOTE_SECRET_KEY` is set | Branch on service key before `decode` or use signed JWT + test |
| F20 | P2 | CONFIRMED | M/S | `shareHtmlDom()` null-deref | `libs/shared/src/services/native/print.ts:25-26` | `querySelector as HTMLElement` passed straight to `cloneNode` | Add null guard with actionable error |
| F21 | P2 | CONFIRMED | M/M | Native video `play()` can hang | `video-player.native.ts:101-109,223,229`, `video-player.component.ts:97,99` | Ready promise may never resolve; non-null assertions + floating promises | Add timeout + `await`/catch + runtime guards |
| F22 | P1 | CONFIRMED | H/M | No Range-resume or size guard; base64 buffering on web | `file.service.ts:53-113`, `resources-download.service.ts:211-221`, `db-attachment.service.ts:141` | Drops restart 20–120 MB downloads from zero; base64 buffers RAM | Add `Range`-resume, persisted progress, pre-flight size check |
| F23 | P2 | LIKELY | M/S | Unsanitized filename passed into native path | `db-attachment.service.ts:133` → `storage-service.ts:57-76` | Acknowledged `TODO - sanitize path` (confined to app sandbox) | Normalize path and reject `..` / absolute paths |
| F24 | P2 | LIKELY | M/S | Dashboard auth guard races session restore | `auth-role.guard.ts:7-19` vs `supabase-auth.service.ts:45-56` | Reload on guarded route bounces valid admin before async `getSession` finishes | Defer guard while `isAuthChecked` pending + preserve `returnUrl` |

## Security

| ID | Sev | Tier | V/E | Title | Source → Sink | Impact | Next step |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F34 | P0 | CONFIRMED | H/S | Deployment email relay is unauthenticated | `functions/dashboard/index.ts:41-42` → `notify-requests.ts:30-136` | Any caller with public anon key can send forged emails via project | Require service JWT or webhook secret + rate-limit |
| F25 | P0 | CONFIRMED | H/S | World-writable Supabase storage buckets | `20240215194323_country_storage_buckets.sql:7-59` + `20250820173508_merged_schema.sql:1359-1499` → `20261012000000_zw_storage_bucket.sql:15-29` | Anon clients can INSERT/UPDATE/DELETE live forecast PDFs & covers in `global/mw/zm/resources/zw` | Scope writes to `authenticated` + `user_has_country_role()`; audit objects |
| F26 | P1 | CONFIRMED | H/M | Stored HTML injection into admin email | `20260213123000_deployment_access_requests.sql:19-24,70-73` → `notify-requests.ts:94,116-134` via `_shared/template.ts:9-12` | Raw `request_message`/`response_message` interpolated into HTML email | DB length/content check + HTML-escape template vars + block anon requests |
| F35 | P1 | CONFIRMED | H/M | Unauthenticated shared-budget overwrite | `functions/budget/share.ts:10,14-29` → `getServiceRoleClient()` upsert | Any anon caller can overwrite/take over another user's `share_code` | Authenticate caller, verify ownership, whitelist columns |
| F27 | P2 | LIKELY | M/S | `join-public` mints `user_roles` for anonymous users | `functions/dashboard/deployments/join-public.ts:12-15` → `:40-42` (`service_role` upsert) | Anonymous sessions receive persisted `user_roles` rows | Reject `is_anonymous` in `join-public` |

- **Hardening ideas (no reachable path found):** `feedback-reports` (`service_role`-only path) and `app_users` (default-deny RLS) reviewed; no reachable exploit found.

## AI-first workflow

| ID | Sev | Tier | V/E | Gap | Command / File | Cadence cost | Smallest fix |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F28 | P1 | CONFIRMED | H/S | Long `AGENTS.md`, no copy-paste verify header | `AGENTS.md:1-130` | Every agent session re-derives install/verify/format/PR steps | Add 20-line header table |
| F29 | P0 | CONFIRMED | H/S | `README.md` quickstart not reproducible | `README.md:16-20`, `package.json:229`, `build-test.yml:49-54`, `ai-worktree-setup.mjs:33-40` | Omits corepack `yarn@4.14.1`, Node 24 CI, env-copy step; typo `lanugage:11` | Replace with verbatim 5-line quickstart |
| F30 | P0 | CONFIRMED | H/M | CI/local verification parity gap | `build-test.yml:58-65` (`# - run: yarn nx test`) vs `tools/ai/ai-{lint,test,typecheck}.mjs` | Locally green `ai:*` checks can fail CI or merge broken tests | Add CI test/typecheck gate or parity job |
| F31 | P1 | CONFIRMED | M/S | `ai:typecheck` undocumented in `AGENTS.md` | `package.json:35`, `tools/ai/ai-typecheck.mjs:1-19`, `AGENTS.md:62-78` | Agents fall back to slow builds or skip template typechecks | Add 3-line `ai:typecheck` stanza |
| F32 | P2 | LIKELY | M/M | No generated API docs | `package.json:5-38`, `.agents/generated-repo-map.md:1-50` | Hand-edited docs drift from Supabase/lib APIs | Document "no API docs by design" or add `supabase gen types` |
| F33 | P1 | LIKELY | H/S | Credential copy sprawl + dirty-tree `HEAD` diff noise | `tools/ai/ai-worktree-setup.mjs:33-40`, `tools/ai/_shared.mjs:41-48` | Copies `.env*`/`google-services.json` silently; dirty sync files break `HEAD` diff | Add redaction warning + `--staged` guidance |

## Second opinion (one-shot, no debate)

| Claim | Verdict | Reviewer note | Human double-check |
| --- | --- | --- | --- |
| F25 world-writable buckets | Agree | `zw/global/mw/zm/resources` all grant `INSERT/UPDATE/DELETE TO public`; `20261103160000_role_and_rls_permissions.sql` tightened tables but skipped `storage.objects` | `POST /storage/v1/object/{zw,mw,zm,resources}/test.txt` with an anon JWT against staging before dropping policies |
| F6 divergent sync hashes | Agree (nuance) | `--pull`/`--no-pull` hash annual only vs `--input` annual+monthly; all 3 diverge on `lastUpdated`; `--no-pull` `isUnchanged` ignores monthly edits (`:1058`) | Run all 3 modes on one station after editing only `.monthly.csv` and compare status/date |
| F10 CSV `resolve([])` | Agree | `loadCSV` never rejects and ignores `res.errors`; `loadedStationData`/`loadedMonthlyData` cache `[]` permanently | Throttle network, open a monthly chart, confirm blank vs error |
| F1/F2 boundary inversion | Agree | `warn` + `* -> *` while `tsconfig.base.json` aliases apps; 10 libs→apps imports found | `nx graph` to confirm libs→apps edges |
| F30 CI tests disabled | Agree | `build-test.yml:61` comments out `yarn nx test` | Run `yarn nx test` locally for a baseline before re-enabling |

**Gap candidates (misses the draft may have):**

| Candidate | Location | Why it matters | Resolution |
| --- | --- | --- | --- |
| Deployment email relay unauthenticated | `dashboard/index.ts:41-42` → `notify-requests.ts:30-136` | Any anon-key caller can send project email | Added as `F34` (split from `F26`) |
| Shared-budget overwrite | `budget/share.ts:14-29` | Caller-supplied `share_code` + `service_role` upsert | Added as `F35` |
| Climate CLI auth vs `sb_secret_` | `sync-climate-data.ts:425`, `_shared/auth.ts:39-41` | `djwt.decode()` throws 500 on opaque `sb_secret_` | Added as `F38` |
| Download cancel deadlock | `resources-download.service.ts:211-222` vs `:142` | `cancel()` leaves promise unsettled, stalling `PQueue` | Added as `F36` |
| Zero-rainfall data loss | `climate-data.service.ts:202-211,226-231` | 0 mm annual records wiped as missing | Added as `F37` |

- Reviewer: `gemini-4-hydrogen` (T3 Code / Antigravity harness), 2026-11-13. Checked: independent sweep of 5 high-risk surfaces (storage RLS, climate hash paths, CSV error paths, download lifecycle, boundaries/CI), claims spot-checked against source, gaps hunted in code. Could not read `AUDIT.md` (uncommitted outside its worktree), so non-named F1–F33 were not cross-checked; no test/build/Deno runs were performed.
- Conflicts and gaps are left to the human; draft was changed for: the 5 gap findings (`F34–F38`), the `F26` split, and post-review template restructuring (`F39–F41` + stack/dependency census by `gemini-4-hydrogen`). No reviewer verdict contradicted an existing finding.

## Appendix — commands and outputs

```text
$ git rev-parse HEAD
3d2fa9e467ef9171de415caec449caeca5c5dbbd

$ git status --porcelain | head -20
 M apps/picsa-server/supabase/data/resource_files_rows.csv
 M apps/picsa-tools/resources-tool/src/app/data/bundles/mw.json
 M apps/picsa-tools/resources-tool/src/app/data/picsa/manuals.ts

$ git log --oneline -8
3d2fa9e46 chore(sync): update repo-audit template and migrations (#889)
21047769e chore: bump video player version (#887)
64b2aa4b0 feat(i18n): Shona/Ndebele manual step translations and translation key cleanup (#886)
30dceb964 data(zw): add shona and ndebele extension manual versions (#885)
0dfa2c46c chore: bump version
c1ea5f587 feat(resources): sync caching determinism and db seed storage filtering (#883)
d71fefacf fix(resources): filter downloads by deployment manifest (#882)
6a311945e fix(dashboard): enforce 5MB file size limit on resource cover upload dropzones (#884)

$ git grep / pattern & dependency census (apps/ + libs/ + tools/, excluding package.json & build outputs)
@Component: 221 (standalone: false = 18 [all budget-tool], standalone: true = 4, @NgModule = 28)
input() / input.required(): 149 vs @Input(): 35
output(): 32 vs @Output(): 11
@if / @for: 547 vs *ngIf / *ngFor: 1
signal() / computed(): 618 vs mobx imports: 6 files (incl. app.config.ts:11)
supabase TS files: 121 vs firebase/firestore: 1 (_server.db.ts via db.module.ts:16) vs parse pkg imports: 0
db_v2 TS files: 33 vs services/core/db/ files: 12 (generateID + PicsaDbModule) vs dexie: 2 vs rxdb-14: 9
0-hit tracked packages: parse, puppeteer, @nx/nest, jest-jasmine2, jest-circus
xlsx: 2 files | exceljs: 2 files | docx: 3 files | sharp: 1 file (apps/picsa-scripts/src/media/image-optimizer.ts)

$ grep TO public storage policies
apps/picsa-server/supabase/migrations/20261012000000_zw_storage_bucket.sql:17-18
  create policy "Storage zw public INSERT" on storage.objects for insert
    to public with check (bucket_id = 'zw');
(plus matching SELECT/UPDATE/DELETE; mirrored in 20240215194323 + 20250820173508 for global/mw/zm/resources)

$ grep loadCSV error path
libs/utils/data.ts:143-146: error: function (err) { console.error(...); resolve([]); }

$ cat .github/workflows/build-test.yml:58-65
- name: Lint
  run: yarn lint
# - run: yarn nx test
- name: Build
  run: yarn nx build
```
