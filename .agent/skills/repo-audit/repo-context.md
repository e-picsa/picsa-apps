# Repo context — owned by this repo

Seeded once by the `repo-templates` sync; afterwards this file is owned by this
repo. Future syncs ignore it. Fill it in so audits ground findings in real
users and explicit scope instead of generic assumptions.

## Project summary

PICSA Apps: Nx monorepo (Angular, Yarn, Firebase/Parse backend) building the
tool suite behind the PICSA agricultural extension programme — dashboard web
apps, a native app build, shared libs, and a climate-data sync pipeline
(canonical station CSVs, capabilities, chart tooling). Large, long-lived
codebase with heavy AI-assisted development.

Note: `.agents` is a symlink to `.agent` — the skill files live at the real
path `.agent/skills/repo-audit/`. `agents.md`, `AGENTS.md`, `gemini.md`, and
`.cursorrules` all resolve to the same agent entrypoint.

## User archetypes

- Extension officer / farmer using PICSA tools on low-connectivity devices; broken means stale or wrong climate charts, failed syncs with no visible recourse, or an unusable app build.
- Dashboard admin curating climate datasets (stations, capabilities, overrides); broken means silent data regressions, no diff preview before committing syncs, or unclear sync provenance.
- Contributor (often AI-assisted) working across `apps/` and `libs/`; broken means unclear Nx boundaries, untested cross-lib changes, and CI that does not catch them.

## Tech focus areas

- Climate sync pipeline correctness: ingestion, SHA-256 audit hashes, capability guards, legacy `override_data` cleanup, sync-date visibility per station/country.
- Chart reactivity and data handling: timespan aggregation (strict null propagation), lazy CSV loading, dynamic terciles/overlays.
- Nx workspace boundaries (`apps/` vs `libs/`), Parse/Firebase schema and rules, test coverage for cross-lib changes.
- Native app build health (E2E) and CI parity for agent-written PRs.

## Scope overrides

- Emphasise: data-pipeline correctness and admin preview/approval UX; Nx boundary discipline.
- Skip: none.
- Replace: none (use the skill's P0–P2 severity).

## Second-opinion preference

- Ask each time (no standing reviewer agreement yet).

## Audit file

- `AUDIT.md` at repo root (no previous audit — first run is the baseline).

## Out of scope

- `dist/`, `build/`, lockfiles, vendored code (mention only if the pipeline is broken).
- Synced climate dataset contents themselves (audit the pipeline and preview tooling, not the data values). `TODO.md` roadmaps describe intent — verify implementation against them.

## Known pain / history

- Long-lived monorepo with accumulated migration layers (climate capabilities architecture replacing legacy overrides).
- Open threads at time of writing: sync-date visibility, visual diff preview before committing syncs, admin on-demand sync endpoints.
