# Repo context — owned by this repo

Seeded once by the `repo-templates` sync; afterwards this file is owned by this
repo. Future syncs ignore it. Fill it in so audits ground findings in real
users and explicit scope instead of generic assumptions.

## Project summary

<!-- TODO: 2–4 sentences. What does this repo ship, on which platforms, and why does it exist? -->

TODO

## User archetypes

<!-- TODO: list 2–4 archetypes. Each: goal, constraint, what "broken" means. Be explicit — the audit ranks by this. Example for a Capacitor video plugin: -->

- TODO archetype 1 — e.g. App dev integrating offline video in low-connectivity field app; broken means crash/ANR on low-end Android.
- TODO archetype 2 — e.g. End user watching training video on old device; broken means stall, battery drain, or lost playback position.
- TODO archetype 3 — e.g. Maintainer triaging AI-assisted PRs; broken means unclear bridge contracts and unreproducible native crashes.

## Tech focus areas

<!-- TODO: name the risky surfaces to emphasise, e.g. Android lifecycle/teardown, iOS background playback, web fallback, bridge typing. -->

- TODO

## Scope overrides

<!-- Optional: emphasise, skip, or replace specific skill sections. Overrides win over the skill defaults. Examples: -->

- Emphasise: TODO (e.g. Android null-safety and lifecycle)
- Skip: TODO (e.g. none, or AI workflow if tracked elsewhere)
- Replace: TODO (e.g. use team RFC-123 for severity instead of the skill's P0–P2)

## Second-opinion preference

<!-- TODO (optional standing agreement): reviewer agent/model family for the one-shot second opinion, e.g. "primary Claude, reviewer GPT" or "no second opinion by default". The skill still confirms with the user when the prompt does not already name one. -->

- TODO (e.g. reviewer: <agent/model>, or: ask each time, or: skip by default)

## Audit file

<!-- Standing location for the report. Default is `AUDIT.md` at repo root; change only if the repo prefers docs/ or another path. A single file always reflects the latest audit — git history preserves prior versions. -->

- `AUDIT.md` at repo root

## Out of scope

<!-- TODO: paths or topics to ignore, e.g. `dist/`, `example-app/`, upstream fork history. -->

- `dist/`, `build/`, lockfiles, vendored code (mention only if the pipeline is broken)

## Known pain / history

<!-- TODO: optional. Fork background, recurring crashes, recent modernisation wins. Helps the auditor avoid re-litigating settled decisions. -->

TODO
