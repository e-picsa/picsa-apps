---
name: redundancy-check
description: Reviews a PR diff for unused variables, imports, styles, and newly redundant code that can be safely removed.
---

# Redundancy Check Skill

Use this skill when reviewing a pull request or branch diff to catch dead code **introduced or newly orphaned by the changes**. It complements `address-pr-feedback` (which triages bot findings) by proactively finding redundancy bots often miss: unused locals, orphaned styles, and logic made redundant by the diff itself.

## Scope Rules (Strict)

1. **Diff-only.** Only flag redundancy in files touched by the PR (`git diff --name-only <base>...HEAD`) or redundancy *directly caused* by the PR (e.g. a helper that lost its last caller in this diff). Never go hunting across the whole monorepo.
2. **Read-only by default.** Report findings as a triage table. Do not delete code, commit, or push without explicit user approval (follow Planning Mode in `AGENTS.md`).
3. **No builds.** Verify with `yarn ai:lint` / `yarn ai:test` only. Never run `yarn build` / `yarn nx build`.

## Phase 1: Get the Diff

```bash
# Base is usually origin/main or origin/master — confirm via gh pr view
git fetch origin
git diff --name-only origin/main...HEAD
git diff origin/main...HEAD --stat
```

Focus review effort on added (`+`) lines and on symbols whose usages were removed (`-`) lines.

## Phase 2: Redundancy Checklist

Work through each category for every touched file. Prefer native search tools (`grep`, `glob`, file reads) over terminal `grep`/`cat`.

### 1. TypeScript — imports, variables, symbols

- [ ] **Unused imports:** every newly added import is referenced in the file. Watch for imports added for an approach later abandoned mid-PR.
- [ ] **Unused locals & params:** every new `const`/`let`, function parameter, destructured field, and type parameter is read. Flag write-only assignments (assigned but never read).
- [ ] **Unused exports:** a newly exported function/type/service is imported somewhere (or is a genuine public API — see false positives). Check `@picsa/*` alias consumers.
- [ ] **Leftover scaffolding:** `console.log`, ad-hoc `// TODO remove`, commented-out code blocks, unused `catch (e)` bindings, placeholder specs.

### 2. Angular 21 component API

- [ ] **Signals:** every new `input()` / `input.required()`, `output()`, `signal()`, `computed()`, `viewChild()` is read in the class or template. A signal written but never read is dead.
- [ ] **Injected services:** every new `inject(...)` / constructor param is used. Remove speculative injections.
- [ ] **Template bindings:** every new component property/method referenced in the HTML actually exists, and conversely every new class member intended for the template is actually bound (orphaned handler = dead code or broken wiring).
- [ ] **Module `imports` arrays:** every entry added to a standalone component's `imports` (e.g. `PicsaTranslateModule`, Material modules) is exercised by the template. Note: `PicsaTranslateModule` is the correct i18n import — flagging it as unused requires confirming no `| translate` pipe usage remains.

### 3. Styles — Tailwind-first, SCSS, and `@apply` consolidation

> **Project convention (Tailwind first):** layout, spacing, flex/grid, and typography belong as Tailwind utilities in the template. Component `.scss` is reserved for what utilities cannot express (pseudo-elements, `position: sticky` coordination, animations, dynamic data-attribute maps). Any new raw CSS that duplicates an existing utility is redundant — use the utility instead.

- [ ] **Raw CSS duplicating a utility:** every newly added raw declaration (`display: flex`, `margin/padding`, `font-size/weight`, `text-align`, `border-radius`, etc.) is checked against Tailwind utilities. If a utility exists, flag **ACCEPT — replace with utility** (e.g. `display: flex; gap: 8px;` → `class="flex gap-2"`).
- [ ] **Repeated utilities → `@apply` class:** when the same Tailwind utility group repeats across selectors/elements in the diff (rule of thumb: same 3+ utilities in 2+ places), extract a shared class composed with `@apply` in the component `.scss`, following established repo pattern:
  ```scss
  // DO — single source of truth
  .photo-add-placeholder {
    @apply h-24 w-24 border-dashed border-2 flex flex-col items-center justify-center text-center rounded border-gray-400 text-gray-600;
  }
  ```
  ```html
  <!-- then reuse -->
  <div class="photo-add-placeholder">…</div>
  ```
  Flag copy-pasted utility strings as **ACCEPT — consolidate via `@apply`**.
- [ ] **Repeated raw declarations → `@apply` class:** same rule for raw CSS — identical declaration blocks in 2+ selectors must become one `@apply`-composed class, not duplicated (Sonar block-duplication threshold ≈ 10 lines applies to styles too).
- [ ] **SCSS selectors:** every new class/id/selector in a touched `.scss` file matches an element in the component's template. Remember Angular `ViewEncapsulation.Emulated` scoping — a selector matching nothing renders nothing.
- [ ] **Removed-template orphans:** if the diff removes template elements, check whether their SCSS selectors are now orphaned and removable.
- [ ] **Contradictory/duplicated utilities:** flag duplicated or contradictory utilities introduced by the diff (e.g. `p-4 p-2`, `flex grid` on the same element) and hardcoded values that duplicate theme tokens — themed elements must use semantic tokens (`primary`, `secondary`) per the UI & Theming skill.
- [ ] **Dead `@keyframes`, mixins, variables:** newly added but never referenced.

### 4. Newly redundant logic (caused by this diff)

- [ ] **Orphaned helpers:** a function/pipe/directive whose last caller was removed in this diff.
- [ ] **Unreachable branches:** `if`/`switch` branches, feature flags, or migration shims (`v0`/`v1` schema handling) made impossible by the new logic.
- [ ] **Collapsed wrappers:** a method/component that now only forwards to another call with no added logic — inline it.
- [ ] **Duplicated blocks:** near-identical blocks added alongside existing ones (Sonar block-duplication threshold ≈ 10 lines) — extract a shared helper. Check `sonar-project.properties` for current exclusions first.
- [ ] **Obsolete comments/docs:** comments describing behaviour the diff changed (e.g. "we sort with bare sort()" when the code now uses `localeCompare`).

## Phase 3: False-Positive Guards (Push Back If Any Apply)

Do **not** flag when:

- The symbol is a **public API / extension point**: `index.ts` barrel exports, NgRx/MobX store actions, Supabase edge-function handlers, or migration SQL referenced externally.
- Usage is **dynamic**: string-based lookup (`form.get(name)`), `ngClass`/`ngStyle` object keys, translation keys passed as variables, or reflection-based DI tokens. Confirm with a runtime-aware search before flagging.
- The import has **side effects**: global SCSS, polyfills, `registerIcons()` calls, or barrel files imported for module registration.
- The parameter is **structurally required**: unused `index` in `@for (...; track ...)`, interface-conformance params (prefix with `_` per TS convention instead of deleting), or Angular lifecycle args.
- The style targets **projected/overlay content**: `::ng-deep`, `:host ::ng-deep`, CDK overlay panes (`cdk-overlay-pane`), or `mat-select` dropdown content rendered outside the component DOM — these selectors legitimately match nothing in the local template.
- The code is a **test fixture/mock**: colocated `*.spec.ts` helpers may appear unused to a naive search but are consumed by the test runner.

## Phase 4: Report Format

Present findings as a triage table. Group by `ACCEPT (remove)` vs `PUSH BACK (keep + reason)`:

| # | Location | Finding | Recommendation | Technical Justification |
|---|---|---|---|---|
| 1 | `budget-table.ts:12` | `import { X }` never referenced | **ACCEPT — remove import** | Added in early commit, approach changed; no template/class usage |
| 2 | `chart-layout.scss:30` | `.legacy-tooltip` has no matching element | **ACCEPT — remove selector** | Template element removed in this diff |
| 3 | `photo-list.component.html:14,22` | same 6-utility string copy-pasted on 2 elements | **ACCEPT — consolidate via `@apply`** | Single `.scss` class with `@apply` is the repo pattern; avoids drift |
| 4 | `index.ts:5` | `export { Y }` has no in-repo importer | **PUSH BACK — keep** | Public barrel API consumed by downstream tools |

Close with one of:

- ✅ *"No redundancy found in this diff."*
- ⚠️ *"N items above — confirm and I will remove the ACCEPT items."*

## Phase 5: Removal & Verification (Only After Approval)

1. Remove only explicitly approved items, one surgical edit per item.
2. Run targeted verification — never broad suites or builds:
   ```bash
   yarn ai:lint            # auto-detects changed files, runs prettier + eslint --fix
   yarn ai:test            # maps changed files to colocated *.spec.ts only
   ```
3. Summarise removed lines/files and lint/test results. Ask before committing or pushing.
