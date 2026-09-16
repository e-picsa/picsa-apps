---
name: review-pr
description: Project-tailored PR reviewer that assesses pull requests for scope creep, over-engineering, code smells, utility/model extraction opportunities, and Angular 21 / Picsa maintainability, producing high-signal mental maps and constructive inline feedback.
---

# PR Review Skill: Maintainability & Scope Triage

Use this skill when conducting an initial review of a pull request from a team member, or when evaluating a large feature branch before submitting a PR.

## Objectives & Review Philosophy

The goal of this review process is **not** to nitpick formatting or duplicate automated SonarQube/linter scans. Instead, it is designed to help a senior reviewer:

1. **Quickly grasp large PRs**: Synthesize architecture, file distribution, and intent into a structured mental map and optimal reading order.
2. **Detect Scope Creep**: Identify unrelated refactoring, unnecessary dependencies, or unannounced database/config changes early.
3. **Prevent Over-Engineering**: Challenge premature abstraction, unnecessary class hierarchies, complex RxJS chains where Signals suffice, and excessive indirection.
4. **Enforce Maintainability & Flat Architecture**: Eliminate deeply nested branching, missing guard clauses, and long-term tech debt.
5. **Identify Utility & Model Extraction Candidates**: Spot business logic trapped in components or duplicate helper functions that should live in `libs/utils/` or `libs/models/`.
6. **Generate Constructive, Actionable Feedback**: Produce ready-to-use review comments with empathetic, technically rigorous explanations and concrete code snippets.

---

## Phase 1: Ingestion & Mental Mapping (Taming Large PRs)

### 1. Gather PR Metadata & Diffs

Run the following commands using native execution to inspect the target PR or branch:

```bash
# When reviewing a GitHub PR by number or branch:
gh pr view <PR_NUMBER_OR_BRANCH> --json number,title,body,baseRefName,headRefName,author,additions,deletions,changedFiles

# Get summary of changed files with churn statistics:
gh pr diff <PR_NUMBER_OR_BRANCH> --stat

# Get list of changed file paths:
gh pr diff <PR_NUMBER_OR_BRANCH> --name-only

# Or when reviewing a local branch against main/develop:
git diff --stat $(git merge-base HEAD origin/main)...HEAD
git diff --name-only $(git merge-base HEAD origin/main)...HEAD
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

### 4. Hotspot Detection

Flag any files with:
- **High Churn**: `> 150` lines changed.
- **Complex Logic**: Large methods, numerous branching paths, or heavy state manipulation.
These files warrant the deepest inspection.

---

## Phase 2: Scope Creep & Blast Radius Check

Evaluate if the PR does what it says on the tin—and **only** what it says.

### Checkpoints:

- [ ] **Alignment with Stated Objective**: Does every changed file directly contribute to the PR title/issue description?
- [ ] **Unrelated Formatting / Cleanups**: Did the author reformat, rename, or touch lines in files unrelated to the ticket?
- [ ] **Dependency Additions**: Did `package.json` introduce new npm dependencies?
  - *Question*: Could native Web APIs (e.g. `crypto.subtle`, `structuredClone`, `Intl`) or existing workspace packages accomplish this?
- [ ] **Cross-Cutting Configuration**: Did an app-level feature touch `tsconfig.base.json`, `tailwind.config.js`, or root workspace scripts without clear justification?
- [ ] **Unannounced Database / Seed Edits**: Did the PR add or modify SQL migrations, Supabase functions, or seed data (`apps/picsa-server/supabase/data/*.csv`) without explicit description?
- [ ] **Multiple Independent Concerns**: Does the PR bundle multiple distinct bugs/features that would be safer split into separate branches?

> [!TIP]
> **Push-Back Guidance for Scope Creep**:
> *"These refactorings/cleanups in `<file>` look great, but they are outside the scope of `<ticket-number>`. Could we split them into a follow-up PR to keep this PR focused and safe to revert if needed?"*

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

Review changes against specific repository standards established in `AGENTS.md`, `.agent/rules/`, and `.agent/AI_GENERATED_KNOWLEDGE.md`.

### 1. Flat Architecture & Guard Clauses (Critical Repo Standard)
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

### 2. Modern Angular 21 Standards
- [ ] **Signals First**:
  - `input()` / `input.required()` instead of `@Input()`
  - `output()` instead of `@Output()`
  - `viewChild()` instead of `@ViewChild()`
  - Local state in `signal()` / `computed()`, not raw mutable properties.
- [ ] **Built-in Control Flow**:
  - `@if`, `@else` instead of `*ngIf`
  - `@for (item of list(); track item.id)` with `@empty` instead of `*ngFor`
  - `@switch`, `@case` instead of `*ngSwitch`
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

### 3. Internationalization (i18n)
- [ ] **No Hardcoded User-Facing Text**:
  - All user-visible strings in templates must use `{{ 'Key' | translate }}` or `translateService.instant()`.
  - Standalone components must import `PicsaTranslateModule` from `@picsa/i18n` (never import `@ngx-translate/core` directly).
  - *Exception*: `apps/picsa-apps/dashboard` is exempt from strict i18n enforcement.

### 4. TypeScript Strictness & Anti-Patterns
- [ ] **No `any`**: Flag `any` or `as any`. Suggest explicit types or `unknown` with type narrowing.
- [ ] **Safe Array Sorting (Sonar S2871)**: Flag bare `.sort()` or `.toSorted()` on string arrays. Require `(a, b) => a.localeCompare(b)`.
- [ ] **Strict Number Parsing**: Flag global `isNaN()` or `parseInt()`. Enforce `Number.isNaN()` and `Number.parseInt(..., 10)`.

### 5. Multi-Runtime & Library Boundaries
- [ ] **`libs/models/` Pure TS**: No executable code or runtime imports. External types must use `import type * as ...`.
- [ ] **`libs/utils/` Isolation**: No Angular, RxDB, or DOM imports. Must be portable to Deno/Node.
- [ ] **No Heavy Export Libs in Shared Libs**: Libraries like `docx` or `downloadjs` must live strictly in `apps/picsa-apps/dashboard/src/app/modules/.../services/`, never in `libs/` (prevents Capacitor bundle bloat).
- [ ] **Unit Test Colocation**: Every new utility or component must have its `*.spec.ts` colocated directly next to the source file, not in an app folder.

---

## Phase 5: Extraction Candidates (Utils & Shared Models)

Inspect the diff specifically for logic that does not belong where it was written.

### 1. Extract to Utils
- **Math, calculation, or parsing logic inside a Component**:
  - *Smell*: A 50-line method in `my-chart.component.ts` that calculates quantiles, rolling averages, or formats climate records.
  - *Fix*: Move to `my-chart.utils.ts` (colocated) or `libs/utils/climate.utils.ts` if reusable.
  - *Benefit*: Component remains a thin view coordinator; pure function can be unit tested without Angular test bed overhead.

### 2. Extract to Shared Models
- **Interfaces declared inside component or service files**:
  - *Smell*: `interface CropHarvestSummary { ... }` defined at the top of `harvest-view.component.ts` and imported by three other files.
  - *Fix*: Move to `libs/models/` or a feature `harvest.models.ts`.

### 3. Check for Pre-Existing Helpers
Before approving new helpers, verify whether the project already has an existing utility:
- `libs/utils/climate.utils.ts` (climatological calculations, season calculations)
- `libs/utils/object.utils.ts` (deep equality, sanitization, mapping)
- `libs/utils/async.utils.ts` (promises, debouncing, timeouts)
- `libs/utils/chart.utils.ts` (value formatting, SVG helpers)

---

## Phase 6: Output Structure & Feedback Generation

When invoking this skill, generate the review output using the following structured format:

```markdown
# Initial PR Review: [PR Title] (#<PR_NUMBER>)

## 1. Executive Summary & Mental Map
- **Author**: @<username> | **Branch**: `<head>` -> `<base>`
- **Blast Radius**: <Low | Medium | High> (<N> files changed, +<adds> / -<dels>)
- **High-Level Purpose**: <1-2 sentences summarizing what this PR accomplishes>
- **Affected Domains**: [e.g. `apps/picsa-tools/climate-tool`, `libs/utils`]

### Recommended Reading Order
1. `libs/models/...` - Data contracts
2. `libs/utils/...` - Pure logic
3. `...component.ts` - UI orchestration & state
4. `...component.html` - Template binding & Tailwind
5. `...spec.ts` - Test coverage

### Hotspot Files (Review with Extra Scrutiny)
- `path/to/large-file.ts` (+180 lines) - <Brief explanation of why it's a hotspot>

---

## 2. Scope & Architecture Assessment

| Checkpoint | Status | Notes |
|---|---|---|
| **Scope Creep** | ✅ Clean / ⚠️ Flagged | <Notes on whether changes stay strictly within ticket scope> |
| **Over-Engineering** | ✅ Clean / ⚠️ Flagged | <Notes on whether abstractions are justified> |
| **Monorepo Boundaries** | ✅ Clean / ⚠️ Flagged | <Notes on models/utils/app separation> |
| **Test Colocation** | ✅ Clean / ⚠️ Flagged | <Notes on spec placement and coverage> |

---

## 3. Maintainability & Code Smells Breakdown

### 🧹 Code Smells & Complexity
- **`<file>:<line>`**: <Description of issue (e.g. deep nesting, missing guard clause, sprawling switch)>

### 🧩 Extraction Opportunities
- **`<file>:<line>`**: <Logic that should be extracted to a pure util function or shared model>

### 🅰️ Angular 21 & Repo Conventions
- **`<file>:<line>`**: <Signal vs Decorator, control flow, i18n, OnPush, or Tailwind vs SCSS issue>

---

## 4. Ready-to-Use Review Comments (Copy & Paste for GitHub)

### Comment 1: [Issue Title]
- **File**: `path/to/file.ts#L45-L60`
- **Severity**: 🔴 Actionable / 🟡 Suggestion / 🟢 Praise
- **Draft Comment**:
> Thanks for implementing this! To align with our flat architecture guidelines, we can simplify this nested logic using early returns and an object lookup:
>
> ```typescript
> // Suggested refactor
> if (!data) return [];
> return METRIC_RESOLVER[type]?.(data) ?? [];
> ```
> This avoids the 3-level nested ternary and makes testing each branch trivial.

### Comment 2: [Issue Title]
...
```

---

## Review Tone & Guidelines for Teammates

- **Explain the "Why"**: Don't just say *"make this a util"*. Explain: *"Extracting this calculation into a pure function in `*.utils.ts` means we can test the math with Jest directly without spinning up Angular component fixtures."*
- **Offer Concrete Code**: Always provide a suggested diff or code snippet showing the simpler alternative.
- **Praise Good Patterns**: Actively call out clean code, great Signal usage, or thorough test coverage.
