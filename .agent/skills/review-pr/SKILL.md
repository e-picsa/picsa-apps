---
name: review-pr
description: Project-tailored PR reviewer that assesses pull requests for scope creep, over-engineering, code smells, utility/model extraction opportunities, and Angular 21 / Picsa maintainability, producing high-signal mental maps and constructive inline feedback.
---

# PR Review Skill: Maintainability & Scope Triage

Use this skill when conducting an initial review of a pull request from a team member, or when evaluating a large feature branch before submitting a PR.

## Objectives & Review Philosophy

The goal of this review process is **not** to nitpick formatting, duplicate automated SonarQube/linter scans, or dump an overwhelming list of 30 comments on a colleague. Instead, it is designed to help a senior reviewer:

1. **Quickly grasp large PRs**: Synthesize architecture, file distribution, and intent into a structured mental map and optimal reading order.
2. **Establish Objective vs. Creep**: Reconstruct the scope baseline and distinguish true scope from unrelated refactoring or unannounced database changes.
3. **Prevent Over-Engineering**: Challenge premature abstraction, unnecessary class hierarchies, complex RxJS chains where Signals suffice, and excessive indirection.
4. **Enforce Maintainability & Flat Architecture**: Eliminate deeply nested branching, missing guard clauses, and long-term tech debt.
5. **Calibrate Utility & Model Extractions**: Apply a strict counter-test before recommending extractions to avoid creating fragmented utility dumping grounds.
6. **Generate High-Signal, Budgeted Feedback**: Deliver calibrated, empathetic, and actionable comments adhering to a strict feedback budget.

---

## Phase 1: Ingestion & Mental Mapping (Taming Large PRs)

### 1. Gather PR Metadata & Diffs

Run the following commands using native execution to inspect the target PR or branch:

```bash
# When reviewing a GitHub PR by number or branch:
gh pr view <PR_NUMBER_OR_BRANCH> --json number,title,body,baseRefName,headRefName,author,additions,deletions,changedFiles

# Summary of changed files with churn statistics:
gh pr diff <PR_NUMBER_OR_BRANCH> --stat

# List changed files detecting renames and copies:
gh pr diff <PR_NUMBER_OR_BRANCH> --name-only

# Or when reviewing a local branch against default remote branch (develop/main):
DEFAULT_BASE=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@') || DEFAULT_BASE="main"
git diff -M -C --stat $(git merge-base HEAD "origin/${DEFAULT_BASE}")...HEAD
git diff -M -C --name-only $(git merge-base HEAD "origin/${DEFAULT_BASE}")...HEAD
```

### 2. Monorepo Domain Distribution Map

Categorize touched files across monorepo boundaries to understand blast radius:

| Domain | Paths | Architectural Role & Sensitivity |
|---|---|---|
| **Super App Shell** | `apps/picsa-apps/app/` | Global navigation, app shell, root guards. High blast radius for mobile app. |
| **Mobile Native** | `apps/picsa-apps/app-native/` | Capacitor native wrappers, native plugins, permissions. |
| **Admin Dashboard** | `apps/picsa-apps/dashboard/` | Web-only admin tool. Does not affect mobile bundle size. Relaxed i18n rules. |
| **Domain Tools** | `apps/picsa-tools/<tool-name>/` | Embedded mini-apps (e.g. `climate-tool`, `crop-tool`). Changes should be self-contained. |
| **Pure Models** | `libs/models/` | **Pure TypeScript only**. Zero runtime code. Only `import type` allowed. |
| **Pure Utilities** | `libs/utils/` | Platform-agnostic helpers. **No Angular, RxDB, or DOM imports allowed**. |
| **Domain Data** | `libs/data/` | Chart definitions, static data structures, domain metadata. |
| **UI & Theme** | `libs/theme/`, `libs/components/` | Shared UI tokens and presentational components. |
| **Supabase / Backend** | `apps/picsa-server/supabase/` | Migrations, Edge Functions, database triggers, seed CSVs. |
| **Workspace Config** | `package.json`, `tsconfig*`, `nx.json`, `tools/` | Workspace-wide impact. High scrutiny required. |

### 3. Recommended Reading Order

Present the reviewer with an optimal reading order to minimize cognitive overhead:

1. **Contracts & Data Models** (`libs/models/` or feature `*.models.ts`): Grasp the core data shapes first.
2. **Pure Business Logic & Utilities** (`libs/utils/` or feature `*.utils.ts`): Review algorithms and data transformations in isolation.
3. **Services & State** (`*.service.ts`, MobX stores, Signal state): Understand state lifecycle, offline handling, and data flow.
4. **UI Components & Templates** (`*.component.ts`, `*.component.html`, `*.component.scss`): Check presentation, binding, and layout.
5. **Tests** (`*.spec.ts`): Verify edge-case coverage and confirm the tests actually test intended behaviors.

### 4. Weighted Hotspot Detection

Do not treat all churn equally. A 200-line test spec, lockfile, or generated seed CSV is not a cognitive hotspot.

- **Exclude from Hotspot Ranking**: `*.spec.ts`, `yarn.lock`, `deno.lock`, `apps/picsa-server/supabase/data/*.csv`, and generated files (`*.generated.ts`, `database.types.ts`).
- **Rank Remaining Files**: Flag files with **> 150 lines changed** or **dense cyclomatic branching / state management** (e.g. complex reducers, multiple nested effects, or heavy SVG manipulation).

### 5. Change Classification (Prevent False Positives on Touched Lines)

Before evaluating any finding, classify each touched section of code:

- **`[NEW]`**: Introduced by this PR. Full standards apply.
- **`[TOUCHED]`**: Pre-existing code in a file this PR touched, but not introduced by this change. Mention only if it materially breaks or destabilizes the new code, or if modernizing it is cheap and immediately adjacent. Never merge-blocking.
- **`[MOVED]`**: Relocated or re-indented without semantic change (detected via `git diff -M -C`). Do not review for style; verify only that behavior and imports are preserved.

---

## Phase 2: Scope Creep & Blast Radius Check

### 0. Establish the Scope Baseline

Before assessing creep, reconstruct and state the baseline explicitly:

- **Stated Objective** (from PR title, description, linked issue):
- **Files Strictly Necessary** to achieve it:
- **Files Present but Not Necessary**:
- **Independently Deployable Slices** found in this PR:

> [!IMPORTANT]
> **Ambiguous Objective Rule**: If the PR title is brief (e.g. "fixes bug") and the body is empty, do **NOT** invent an intent and then flag creep against your invention. State explicitly: *"Objective is ambiguous; scope creep evaluation has low confidence until author clarifies intent."* Add a question to Section 5.

### Checkpoints:

- [ ] **Alignment with Stated Objective**: Does every changed file directly contribute to the reconstructed objective?
- [ ] **Unrelated Formatting / Cleanups**: Did the author reformat, rename, or touch lines in unrelated modules?
- [ ] **Dependency Additions**: Did `package.json` introduce new npm dependencies? Could native Web APIs (`crypto.subtle`, `structuredClone`, `Intl`) or existing workspace packages suffice?
- [ ] **Cross-Cutting Configuration**: Did an app-level feature touch `tsconfig.base.json`, `tailwind.config.js`, or root workspace scripts without clear justification?
- [ ] **Unannounced Database / Seed Edits**: Did the PR add or modify SQL migrations, Supabase functions, or seed CSVs (`apps/picsa-server/supabase/data/*.csv`) without explicit explanation?
- [ ] **Multiple Independent Concerns**: Does the PR bundle multiple distinct bugs/features that would be safer split into separate branches?

> [!TIP]
> **Push-Back Guidance for Scope Creep**:
> *"These cleanups in `<file>` look great, but they are outside the scope of `<ticket>`. Could we split them into a follow-up PR to keep this PR focused and easy to revert if needed?"*

---

## Phase 3: Over-Engineering & Simplicity Audit

The Picsa codebase prioritizes flat, straightforward code over clever abstractions.

### Red Flags:

1. **Premature Class Hierarchies & Factory Patterns**:
   - Creating an abstract base class or factory for something that has only one implementation.
   - *Alternative*: Plain TypeScript functions or a simple object mapping.
2. **RxJS / Signal Tangling**:
   - Creating complex reactive pipelines (`toObservable` -> `debounceTime` -> `switchMap` -> `toSignal`) for purely synchronous or local UI state.
   - *Alternative*: Use standard `signal()` and `computed()` directly.
3. **Single-Use Services**:
   - Creating an `@Injectable()` service for a stateless calculation or a single fetch call that is only used by one component.
   - *Alternative*: Colocated pure utility function.
4. **Over-Parameterized Generics**:
   - Generic types `<T, K, V>` that obfuscate domain models (`IClimateData`, `ICropRecord`, `IStationMeta`).
   - *Alternative*: Use concrete domain types.
5. **Speculative Future-Proofing**:
   - Adding unused configuration flags, optional parameters, or extensible handler slots "in case we need it later".
   - *Alternative*: Implement only what the current ticket requires (YAGNI).

---

## Phase 4: Maintainability, Architecture & Code Smells

### Pass Gating (Skip Irrelevant Passes)

To prevent shallow checklist fatigue and token bloat, execute only passes triggered by the diff. Report skipped passes as `N/A` rather than `Clean`:

| Pass | Trigger Condition |
|---|---|
| **Angular 21 Conventions** | Any `*.component.*`, `*.directive.ts`, `*.pipe.ts` changed |
| **Internationalization (i18n)** | Any `*.html` or user-facing `.ts` changed outside `apps/picsa-apps/dashboard/` |
| **Monorepo / Lib Boundaries** | Any `libs/` path changed |
| **Backend & Supabase** | Any `apps/picsa-server/` path changed |
| **Workspace Config** | `package.json`, `tsconfig*`, `nx.json`, or `tools/` changed |
| **Bundle Impact** | New npm dependency added, or new external import in `libs/` |

---

### Checklists for Active Passes:

#### 1. Flat Architecture & Guard Clauses (Always Active)
- [ ] **No Deep Nesting**: Disallow nested `if`/`else` ladders (>2 levels) or nested ternaries.
- [ ] **Early Returns**: Require guard clauses for invalid inputs, null states, or edge cases at the top of functions.
- [ ] **Declarative Lookups**: Replace sprawling `switch` statements or `if-else` chains with dictionary/object maps.

```typescript
// ❌ SMELL: Deeply nested branching
function getMetricBadge(metric?: IMetric) {
  if (metric) {
    if (metric.status === 'active') {
      if (metric.value > 100) {
        return 'high';
      } else {
        return 'normal';
      }
    } else {
      return 'inactive';
    }
  }
  return 'unknown';
}

// ✅ MAINTAINABLE: Flat with early returns & lookup
function getMetricBadge(metric?: IMetric): MetricBadgeStatus {
  if (!metric) return 'unknown';
  if (metric.status !== 'active') return 'inactive';
  return metric.value > 100 ? 'high' : 'normal';
}
```

#### 2. Angular 21 Standards (When Triggered)
- [ ] **Signals First**:
  - `input()` / `input.required()` instead of `@Input()` in `[NEW]` code.
  - `output()` instead of `@Output()`.
  - `viewChild()` instead of `@ViewChild()`.
  - Local state in `signal()` / `computed()`, not raw mutable properties.
- [ ] **Built-in Control Flow**:
  - `@if`, `@else` instead of `*ngIf`.
  - `@for (item of list(); track item.id)` with `@empty` instead of `*ngFor`.
  - `@switch`, `@case` instead of `*ngSwitch`.
- [ ] **OnPush Change Detection**:
  - Every component must declare `changeDetection: ChangeDetectionStrategy.OnPush`.
- [ ] **Component Structure**:
  - Must use separate `.ts`, `.html`, and `.scss` files. No inline templates or styles.
- [ ] **Angular Material Directives**:
  - Must use attribute directives: `<button matButton>`, `<button matButton="filled">`, `<button matIconButton>`.
  - Flag legacy tags: `<button mat-button>`, `<button mat-raised-button>`, `<button mat-icon-button>`.
- [ ] **Tailwind vs SCSS**:
  - Layout, spacing, typography, and flexbox must use Tailwind utility classes.
  - Component `.scss` must **not** contain deeply nested selectors (`.a { .b { .c { ... } } }`) which explode Angular emulated encapsulation CSS budgets (>4 kB).
- [ ] **Asynchronous Effects Warning**:
  - No `effect(async () => ...)`! Angular does not track signals across `await`.
  - Any Promise inside an `effect()` must have an explicit `.catch(...)` to prevent `ERR_UNHANDLED_REJECTION` test crashes.

#### 3. Internationalization (i18n) (When Triggered)
- [ ] **No Hardcoded User-Facing Text**:
  - All user-visible strings in templates must use `{{ 'Key' | translate }}` or `translateService.instant()`.
  - Standalone components must import `PicsaTranslateModule` from `@picsa/i18n` (never import `@ngx-translate/core` directly).
  - *Exception*: `apps/picsa-apps/dashboard` is exempt from strict i18n enforcement.

#### 4. Multi-Runtime & Library Boundaries (When Triggered)
- [ ] **`libs/models/` Pure TS**: No executable code or runtime imports. External types must use `import type * as ...`.
- [ ] **`libs/utils/` Isolation**: No Angular, RxDB, or DOM imports. Must be portable to Deno/Node.
- [ ] **No Heavy Export Libs in Shared Libs**: Libraries like `docx` or `downloadjs` must live strictly in `apps/picsa-apps/dashboard/src/app/modules/.../services/`, never in `libs/` (prevents Capacitor bundle bloat).
- [ ] **Unit Test Colocation**: Every new utility or component must have its `*.spec.ts` colocated directly next to the source file, not in an app folder.

#### 5. Skip CI-Enforced Rules (Do Not Duplicate CI)
Do **NOT** raise manual review comments for rules already enforced automatically by CI linters and SonarCloud on this repo:
- Sonar S2871 (`Array.prototype.sort()` comparator requirement)
- Loose `isNaN()` vs `Number.isNaN()` and `parseInt()` radix
- Minor formatting, trailing commas, or quote styles (handled by `yarn ai:lint`)
Focus your feedback on architecture, logic clarity, and maintainability traps that automated tools miss.

---

## Phase 5: Extraction Candidates & Counter-Test

### 1. Extraction Counter-Test (Do Not Over-Extract)

Premature extraction creates fragmented indirection and unneeded files. Recommend extraction only if **at least two** of the following hold:

- [ ] Logic is genuinely platform-agnostic (zero Angular, RxDB, or DOM dependencies).
- [ ] Inputs and outputs are stable and serializable.
- [ ] There is a **real second caller today**, OR the logic is non-trivially testable in isolation (complex math, branching algorithms, date/season manipulation, parsing).
- [ ] The component method exceeds ~30 lines or mixes view presentation with heavy domain calculations.

### 2. Destination Hierarchy

When extraction is justified, recommend destinations in strict order:

1. **Colocated `*.utils.ts` next to the feature** (e.g. `crop-chart.utils.ts` next to `crop-chart.component.ts`) — Default choice for feature-specific logic.
2. **Existing `libs/utils/<domain>.utils.ts`** — If logic fits an established domain (`climate.utils.ts`, `object.utils.ts`, `async.utils.ts`).
3. **New file in `libs/utils/`** — **Only** if there is an existing or immediate cross-app consumer (e.g. shared between Super App and Dashboard).

Never recommend a generic `utils.ts` dumping ground. Always name the target file and grep the codebase first to verify if a helper already exists:
```bash
grep -rn "functionNameOrConcept" libs/utils libs/data --include="*.ts"
```

---

## Severity Calibration & Output Budget

To avoid reviewer fatigue and ensure high signal, calibrate every finding:

| Severity | Criteria | Expectation |
|---|---|---|
| 🔴 **Actionable** | Incorrect behavior, data loss, unhandled null/race condition, missing i18n on user-facing strings, `libs/` boundary violation, heavy export lib in shared lib, `effect(async)`, unhandled promise in effect, unannounced database migration. | Must be resolved before merge. |
| 🟡 **Suggestion** | Maintainability improvements: nested branching, valid extraction candidates, over-abstraction, missing `OnPush`, legacy decorators in `[NEW]` code. | Author may decline with technical rationale. Must include `Confidence: High/Medium/Low`. |
| 🟢 **Praise** | Notably clean patterns, elegant Signal usage, comprehensive edge-case specs. | Reinforces great engineering. |

### Output Budget Rules:
- **Maximum 8 review comments total**, of which **no more than 5 are 🟡 Suggestions**.
- If more issues exist, group them into a single thematic comment (e.g. *"Angular 21 Modernization: 4 instances of legacy control flow in new templates"*), listing locations instead of filing separate comments.
- Move lower-priority, debatable, or sub-budget findings to **Section 6: Suppressed / Low-Confidence Observations** for the senior reviewer's internal discretion.

**Do NOT file comments for**:
- Legacy patterns on lines that the PR merely moved or re-indented (`[MOVED]`).
- Style or naming preferences with no maintainability consequences.
- Duplication occurring exactly twice with no third caller in sight.
- Anything already covered by automated linting or SonarQube checks.

---

## Phase 6: Output Structure & Feedback Generation

When generating the review report, strictly use the following layout:

```markdown
# Initial PR Review: [PR Title] (#<PR_NUMBER>)

## 1. Executive Summary & Mental Map
- **Author**: @<username> | **Branch**: `<head>` -> `<base>`
- **Blast Radius**: <Low | Medium | High> (<N> files changed, +<adds> / -<dels>)
- **High-Level Purpose**: <1-2 sentences summarizing what this PR accomplishes>
- **Affected Domains**: [e.g. `apps/picsa-tools/climate-tool`, `libs/utils`]

### Recommended Reading Order
1. `libs/models/...` - Data contracts
2. `libs/utils/...` - Pure logic & calculations
3. `...service.ts` - State management & data sync
4. `...component.ts` / `...component.html` - UI binding & presentation
5. `...spec.ts` - Unit test coverage

### Hotspot Files (Scrutinize Carefully)
*(Excludes tests, lockfiles, seed CSVs, and generated types)*
- `path/to/dense-file.ts` (+180 lines) - <Why this file is a hotspot>

---

## 2. Scope & Architecture Assessment

- **Stated Objective Baseline**: <Explicit summary reconstructed from PR or issue>
- **Scope Alignment**: <Clean | Flagged | Ambiguous> (Confidence: <High | Medium | Low>)

| Checkpoint | Status | Notes |
|---|---|---|
| **Scope Creep** | ✅ Clean / ⚠️ Flagged | <Notes on whether changes stay strictly within ticket scope> |
| **Over-Engineering** | ✅ Clean / ⚠️ Flagged | <Notes on whether abstractions are justified> |
| **Angular 21 Conventions** | ✅ Clean / ⚠️ Flagged / ➖ N/A | <Signals, control flow, OnPush, Material> |
| **i18n Compliance** | ✅ Clean / ⚠️ Flagged / ➖ N/A | <No hardcoded strings, PicsaTranslateModule> |
| **Monorepo Boundaries** | ✅ Clean / ⚠️ Flagged / ➖ N/A | <Models/utils isolation, no heavy exports in libs> |
| **Backend & Supabase** | ✅ Clean / ⚠️ Flagged / ➖ N/A | <Migrations, triggers, deterministic secrets> |

---

## 3. Ready-to-Use Review Comments (Copy & Paste for GitHub)
*(Adhering to budget: Max 8 comments, max 5 🟡)*

### Comment 1: [Issue Title]
- **File & Line**: `path/to/file.ts#L45-L60`
- **Classification**: `[NEW]` | `[TOUCHED]`
- **Severity**: 🔴 Actionable / 🟡 Suggestion / 🟢 Praise
- **Confidence**: <High | Medium | Low> *(Mandatory for 🟡)*
- **Draft Comment**:
> Thanks for adding this! To align with our flat architecture conventions, we can simplify this nested check using early returns:
>
> ```typescript
> // Suggested refactor
> if (!data) return [];
> return METRIC_RESOLVER[type]?.(data) ?? [];
> ```
> This avoids the 3-level nesting and allows testing each branch independently.

---

## 4. Questions for the Author
- <Ambiguity about intent, undocumented architectural choices, or missing context>
- <Decisions where domain / agronomy knowledge is required before judging>

---

## 5. Suppressed / Low-Confidence Observations (Reviewer Eyes Only)
*Items below the comment budget or below confidence thresholds, noted for your personal discretion rather than posting to the author:*
- `<file>:<line>`: <observation> (Reason suppressed: e.g. low confidence / minor nit / touched legacy line)
```

---

## Review Tone Guidelines

- **Explain the "Why"**: Never give bare instructions like *"extract this"*. Explain the technical payoff: *"Extracting this calculation to a colocated `*.utils.ts` lets us test the edge cases directly in Jest without mounting the Angular component fixture."*
- **Provide Concrete Code**: Always provide an actionable code snippet or suggested refactoring.
- **Praise Clean Work**: Highlight clean Signal patterns, solid test cases, or great use of OnPush.
