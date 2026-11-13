# Repo context — owned by this repo

Seeded once by the `repo-templates` sync; afterwards this file is owned by this
repo. Future syncs ignore it. Fill it in so audits ground findings in real
users and explicit scope instead of generic assumptions.

## Project summary

PICSA Apps: Nx 22 monorepo (Angular 21, Yarn 4, Capacitor 8, Supabase backend)
building the tool suite behind the PICSA agricultural extension programme —
the farmer/extension-officer super-app (`apps/picsa-apps/app` + `app-native`),
admin dashboard (`apps/picsa-apps/dashboard`), feature tools (`apps/picsa-tools/*`),
shared libs (`libs/*`), Supabase edge functions/migrations (`apps/picsa-server`),
and data sync scripts (`apps/picsa-scripts`). Large, long-lived codebase with
heavy AI-assisted development and multiple active/stalled migration layers.

Skill files live at `.agents/skills/repo-audit/`, and `AGENTS.md` is the canonical
agent entrypoint.

## User archetypes

- Extension officer / farmer using PICSA tools on low-connectivity devices; broken means stale or wrong climate charts, failed syncs with no visible recourse, bloated offline bundles, or an unusable app build.
- Dashboard admin curating climate datasets (stations, capabilities, overrides) and resources; broken means silent data regressions, no diff preview before committing syncs, or unclear sync provenance.
- Contributor / long-term maintainer (human or AI-assisted) working across `apps/` and `libs/`; broken means competing backends/state/storage patterns, unclear canonical paths, untested cross-lib changes, and CI that does not catch them.

## Tech focus areas

- **Backend & persistence consolidation**: Supabase primary backend (Auth, Postgres/RLS, Storage, Edge Functions) vs legacy Firebase/Firestore (`_server.db.ts`, `firebase.service.ts`) and dead `parse` remnants (distinguishing active Capacitor Firebase plugins for Analytics/Crashlytics/Performance from retired Firestore/DB paths); overlapping client storage layers (`db_v2` RxDB v16 vs legacy `db/`, `dexie`, and `rxdb-14` migration shim).
- **State management & Angular 21 consistency**: Signals + RxJS vs legacy `mobx-angular` (`budget-tool`, root `app.config.ts`) and inconsistent service-provider patterns; remaining `NgModule` / `standalone: false` / `@Input()`/`@Output()` pockets vs `.agents/skills/angular/SKILL.md`.
- **Dependency hygiene (`package.json` & workspace manifests)**: dead, duplicate (e.g. dual spreadsheet/DB/HTTP libs), outdated/EOL, or misplaced runtime dependencies inflating app/native bundles or locking upgrades.
- **System comprehension & doc parity**: accuracy of `README.md`, `AGENTS.md`, `.agents/rules/tech-stack.md`, `.agents/codebase-map.md`, and `tools/legacy` vs actual code, plus whether legacy code is quarantined or leaking into new work.
- **Climate sync pipeline correctness**: ingestion, SHA-256 audit hashes, capability guards, legacy `override_data` cleanup, sync-date visibility per station/country.
- **Chart reactivity and data handling**: timespan aggregation (strict null propagation), lazy CSV loading, dynamic terciles/overlays.
- **Nx workspace boundaries (`apps/` vs `libs/`), Supabase RLS/Edge Functions, and CI parity** (including native Android build health).

## Scope overrides

- Emphasise: long-term maintainability and mental-model clarity (backend, persistence, state, and Angular pattern consolidation), dependency hygiene, data-pipeline correctness, admin preview/approval UX, and Nx boundary discipline.
- Skip: none.
- Replace: none (use the skill's P0–P2 severity).

## Second-opinion preference

- Ask each time (no standing reviewer agreement yet).

## Audit file

- `.agents/skills/repo-audit/AUDIT.md` (same folder as this skill; no committed baseline yet — move/retire any root `AUDIT.md`).

## Out of scope

- `dist/`, `build/`, lockfiles, vendored code (inspect `package.json` and build stats for bundle-weight evidence only, never audit `dist/` as source).
- Synced climate dataset contents themselves (audit the pipeline and preview tooling, not the data values). `TODO.md` roadmaps describe intent — verify implementation against them.

## Known pain / history

- Long-lived monorepo with accumulated, partially completed migrations:
  - Backend: Firebase/Parse → Supabase (active Capacitor Firebase telemetry plugins remain alongside legacy Firestore code and unused `parse`).
  - Client storage: legacy `db/` + Dexie + `rxdb-14` migration shim alongside `db_v2` (RxDB v16).
  - State & Angular APIs: MobX (`budget-tool`) + `NgModule`/`standalone: false` pockets alongside modern Signals + standalone components.
  - Climate: climate capabilities architecture replacing legacy overrides; open threads on sync-date visibility, visual diff preview before committing syncs, and admin on-demand sync endpoints.
