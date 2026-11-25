---
name: 'report-updates'
description: Generate isolated funder update notes (ZM/MW combined and Zimbabwe separate) from all e-picsa repos since each funder's previous release tag.
---

# Report Updates Skill

Use this skill when the author asks for funder/progress update notes. The author reports roughly every 3 months with top-level summaries only, and different funders may be on different reporting cadences.

## 0. Required Inputs & Baseline Discovery (ask first, do not guess)

Before pulling GitHub data:

1. Inspect `reports/_meta.json` (gitignored) and list existing reports in:
   - `reports/mw_zm/` — combined Zambia & Malawi history (`<YYYY-MM>.md`)
   - `reports/zw/` — Zimbabwe history (`<YYYY-MM>.md`)
2. Read the **most recent previous report** in each folder to determine:
   - Each funder's **own** `from_release` tag and date (do NOT assume both funders share the same starting tag).
   - Tone, tool-name headings, and what was **already reported** (to prevent duplicates).
   - If a previous file is empty (0 bytes), flag it to the author rather than inventing its content.
3. Confirm with the author:
   - `from_release` per funder (e.g. `mw_zm: v5.14.0`, `zw: v5.6.1`). If missing, ask — never guess.
   - `to_release` (defaults to latest `e-picsa/picsa-apps` release).
   - Whether both outputs (`reports/mw_zm/<YYYY-MM>.md` and `reports/zw/<YYYY-MM>.md`) are required.

## 1. Repos To Pull (discover dynamically, never silently skip)

1. Run `gh repo list e-picsa --limit 50 --json name,pushedAt,isArchived` and include **every non-archived repo** with `pushedAt` newer than the earliest `from_release` date.
2. Always check the core repos:
   - `e-picsa/picsa-apps` — source of truth for version tags. Pull `gh release list` and `git log <from>..<to> --oneline --no-merges` for each funder's range.
   - `e-picsa/geo-data` — usually no GitHub Releases; filter merged PRs by `mergedAt > <from_date>`.
   - `e-picsa/user-guide` — check releases + merged PRs.
   - `e-picsa/docs` — check merged PRs.
   - Plugin / companion repos (`capacitor-video-player`, `capacitor-resumable-download`, `capacitor-offline-transfer`, `enketo-webform`, and any new active repos).
3. Record every reviewed repo and its status (active vs `stable – no changes this period`) in `reports/_meta.json`. Do **not** print developer repo lists in the funder-facing report body.

Tip: split collection across parallel subagents (1. `picsa-apps` releases/commits per range, 2. external `e-picsa` repos, 3. country-specific data diffs via `git diff --name-status` on `summaries/`, `crop-probability-tool`, and `geoLocation/`).

## 2. Triage Board Cross-Reference (gitignored URL)

- Read `triage_sheet_url` from `reports/_meta.json` (gitignored). **Never commit the spreadsheet URL to `SKILL.md` or any tracked file.**
- If `triage_sheet_url` is set and publicly readable, fetch its CSV export (`.../export?format=csv&gid=0`) and cross-reference:
  1. **Verify completeness**: check `Done` items tagged within the reporting range to ensure no partner-facing milestone was missed.
  2. **Board hygiene**: flag to the author (in chat, not inside the funder report) any open/unprioritised board rows that appear completed, duplicates, or major shipped features worth adding to the board as `Done`.
- Link to `triage_sheet_url` in the report intro/footer for full task lists and next priorities.

## 3. What To Include, Deduplicate, and Omit

- **Include only shipped, live partner-facing items**: visible app/dashboard features, new data coverage, new languages, admin workflows, print/export outputs, user-visible reliability fixes, headline app/map sizes, and user-guide deliverables.
- **Omit unintegrated or standalone components**: do not report new plugins, backend scripts, or infrastructure work (even if merged in a companion repo) until they are actually integrated and live in the app, dashboard, or scheduled CI.
- **Deduplicate against the previous report (mandatory)**: compare every candidate item against that funder's previous report. Omit anything already announced unless highlighting a clear new delta (e.g. *"Added PDF export alongside Word export"*).
- **Omit purely technical items**: CI/workflow bumps, PR-agent template syncs, worktree tooling, agent config changes, internal refactors, seed script internals, minor CSS tweaks. When in doubt, omit and keep rows concise.

## 4. Two Isolated Reports (strictly no cross-reference)

- `reports/mw_zm/<YYYY-MM>.md` must **never** mention Zimbabwe, ZW, Shona, Ndebele, Masvingo, or ZW-specific names.
- `reports/zw/<YYYY-MM>.md` must **never** mention Zambia, Malawi, ZM, MW, or where placeholder content came from (say *"starter videos included as placeholders until local videos are recorded"*).
- Split user-guide updates: ZM/MW guide updates go only in `mw_zm`; Zimbabwe guide updates go only in `zw`.
- **Contract / timesheet attribution**: If the author provides timesheet notes or contract splits (e.g. GIZ vs Zimbabwe), attribute shared platform/dashboard/sustainability work to the funder whose contract funded it so overlapping work is not double-reported across both reports.

## 5. Table Format & Cell Structure

Next priorities live in the triage sheet — do **not** include a Next Priorities column.

```markdown
| # | Component | Updates | Screenshots |
| :---- | :---- | :---- | :---- |
| **1** | **App** | ... | ... |
| **2** | **Dashboard** | ... | ... |
| **3** | **Data & Resources** | ... | ... |
| **5** | **Sustainability** | ... | ... |
|  | **Additional** | ... | ... |
```

- `#` is fixed: `1` App, `2` Dashboard, `3` Data & Resources, `5` Sustainability, then blank `Additional` (`4` is skipped — legacy Direct-to-Farmer is merged into App).
- `Screenshots` column is mandatory — descriptive placeholders only (e.g. `[Screenshot – Climate Tool: recommended nearest station for selected district]`), never binary blobs.
- Tables cannot contain literal newlines: use `<br><br>` between paragraphs and between screenshot placeholders.
- **Group App and Dashboard updates by consistent tool/area names** (matching previous reports), each with a bold lead:
  - App: `**Climate Tool**`, `**Crop Probability**`, `**Forecasts**`, `**Budget Tool**`, `**Farmer Videos**`, `**Resources**`, `**General**`.
  - Dashboard: `**Climate**`, `**Crop Probability**`, `**Forecasts**`, `**Resources & Access**`, `**Translations**`, `**Farmer Videos**`.
- **Do not repeat data updates in App and Data rows**:
  - App = functionality only.
  - Data & Resources = country content only, under bold country headings (`**ZM**`, `**MW**`, `**Training**` for `mw_zm`; `**ZW – Climate**`, `**ZW – Crops**`, `**ZW – Videos & Resources**` for `zw`).

## 6. Style (non-developers read this)

- No PR numbers (`#915`), commit SHAs, repo names, or file paths in the report tables.
- No extended technical stats (dex bytes, AAB deltas, SVG percentages, zoom-level tables). Headline figures only when meaningful (e.g. approximate install or offline map download size).
- No fluff or marketing buzzwords (avoid *"behind the scenes"*, *"major drop"*, *"everyday improvements"*, *"onboarding milestone"*, *"built for old phones"*). State facts plainly with crisp action verbs (`Add support for…`, `Improve…`, `Fix…`, `Expand…`).
- Do not generalise reliability/device work — list the concrete user-visible behaviours fixed (for example: *fixed app closing when rotating the phone during playback or reopening after being in the background*).

## 7. User Guide (do not omit)

User-guide updates are a partner deliverable. Include them in the `Additional` row with a bold `**User Guide**` lead and screenshot placeholders, split by funder so each report only covers its relevant variant and pages.

## 8. Output, Tracking & Verification

- Write outputs only to gitignored country folders:
  - `reports/mw_zm/<YYYY-MM>.md` and `reports/mw_zm/<YYYY-MM>-short.md`
  - `reports/zw/<YYYY-MM>.md` and `reports/zw/<YYYY-MM>-short.md`
  - Each `*-short.md` is a concise narrative summary matching the tone and length of prior short reports (`reports/zw/2026-07-short.md`, `reports/mw_zm/2026-11-short.md`): title, reporting period/version header, short intro, concise bulleted list of main work completed, availability summary, and brief next-steps paragraph.
- Never overwrite previous reports.
- Update `reports/_meta.json` (gitignored) with per-funder `from_release` / `to_release`, `triage_sheet_url`, `generated_at`, `repos_reviewed[]`, and `triage_board_last_checked`.
- Optionally store raw `gh` JSON dumps under `cache/` (gitignored). Never commit `reports/` or `cache/`.

### Pre-finish checklist

- [ ] Both files exist under `reports/mw_zm/` and `reports/zw/` with accurate version ranges in headers (matching each funder's own previous report).
- [ ] Every station/district/release count is verified directly from git diffs or data files (and arithmetic `new + updated = total` checks out).
- [ ] No items already reported in that funder's previous draft are repeated as new.
- [ ] 4-column markdown tables parse cleanly; `Screenshots` column is non-empty.
- [ ] No PR numbers, commit SHAs, file paths, repo lists, or banned buzzwords in funder-facing text.
- [ ] No cross-funder leaks (`mw_zm` vs `zw`).
- [ ] Triage sheet URL is present in `reports/_meta.json` and report links, and **absent** from `SKILL.md` and all git-tracked files.

```markdown
<!-- Example Updates cell (<br><br> paragraphs, tool-name bold leads, no PR numbers) -->
**Climate Tool**<br><br>Search recommends the nearest weather station for the selected district.<br><br>**Crop Probability**<br><br>Add support for sharing probability tables as images and removing water requirements.
```
