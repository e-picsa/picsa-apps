---
name: fundamental-principles
description: Core principles that must be applied to ALL tasks, including mandatory self-documentation and knowledge persistence at the end of workflows.
---

# Fundamental Principles

This skill defines the core meta-instructions that you must follow for **every** task you undertake in this workspace.

## 1. Auto-Knowledge Generation (Mandatory Task Finalization)

As an intelligent agent, you must improve your own workflow and help future agents by leaving a trail of knowledge.

**Before starting a new complex task:**

- ALWAYS check `.agents/AI_GENERATED_KNOWLEDGE.md` for learnings and context from previous sessions.

**At the end of EVERY complex task or when significant decisions are made:**

- You MUST automatically record your learnings.
- Do this by appending a new entry to `.agents/AI_GENERATED_KNOWLEDGE.md`.
- Document things like:
  - New established architectural patterns.
  - Tricky bugs you resolved and their root cause.
  - Workarounds or specific commands required to build/test successfully.

## 2. Core Coding Rules

- Do NOT leave internal monologue, questions, or reasoning in code comments (e.g., `// Wait, actually...`).
- Comments should only explain "why" the code does something if it's not obvious, or "what" complex logic establishes.
- **Minimalist, Farmer-First UI (No Over-Engineering or Visual Noise)**: Do NOT add superfluous visual elements, chips, tags, metadata badges, or metrics unprompted (e.g., "Inside District", "X km from center", "Y years of data", extra status icons). Keep interfaces clean, direct, and focused on essential actions with minimal cognitive load (e.g., "View" instead of verbose button text). Avoid adding unprompted visual noise for the sake of it.
- **Database Exploration**: ALWAYS use the `supabase-db` MCP skill (`mcp_supabase-db_query`) when trying to introspect the Supabase database (e.g., viewing registered functions, checking schema, exploring tables). This is significantly more efficient and accurate than reading raw schema files using `grep_search` or `view_file`.
- **Grounding in Real Data over Hypothetical Over-Engineering**: Never write defensive logic, regex filters, or fallback branches for hypothetical scenarios. Always query the real Supabase database or storage bucket first to inspect actual data and schemas before implementing filtering or migration code.
- **Fail-Fast Remote Integration**: In synchronization and data pipeline scripts, network or storage operations must fail fast with a descriptive error. Never swallow errors or default missing remote metadata to "treated as fresh".
- **Angular Material `<mat-icon>` Resizing**: Never resize `<mat-icon>` using Tailwind sizing or typography classes (`w-*`, `h-*`, `text-*`, `!w-*`, `!h-*`, `!text-*`)—Tailwind `text-*` sets `line-height` and throws off vertical alignment. Resize `<mat-icon>` only via Angular Material mechanisms (`inline` inside inline text, parent Material theme tokens, or manual SCSS setting `font-size`, `width`, and `height` together with `line-height: 1`). See `.agents/skills/ui-theming/SKILL.md`.

## 3. Destructive Commands (CRITICAL)

- **NEVER** run destructive terminal commands such as `git restore`, `git reset --hard`, `git checkout .`, `git clean -fd`, or `rm -rf` under any circumstances unless explicitly requested by the user.
- Even if attempting to undo a previous programmatic mistake, you must either manually revert the specific edits you made using file replacement tools, or explicitly ask the user for permission to execute a destructive `git` command to discard changes. This is to ensure you do not destroy uncommitted, in-progress work the user may have in their working directory.

## 4. Verification Workflow (No Redundant Builds or Broad Test Suites)

- **Strict Build Prohibition**: **NEVER** run full application builds (`yarn build`, `yarn nx build`) after editing code. Builds compile assets, run full AOT passes, and bundle native wrappers, which wastes tokens and minutes.
- **Typechecking (ALWAYS via `yarn ai:typecheck`)**: After modifying TypeScript or Angular HTML template files, run `yarn ai:typecheck` with no args (auto-detects changed files vs `HEAD`, maps changed libs/apps to affected Nx projects, and verifies types + Angular templates via `ngc --noEmit` in 1-2 seconds without running heavy production builds).
- **Linting (ALWAYS via `yarn ai:lint`)**: After modifying files, run `yarn ai:lint` with no args (auto-detects changed files vs `HEAD`, no staging required, applies `prettier --write` + `eslint --fix`). Never run `yarn nx lint`, bare `eslint`/`prettier`, or `lint-staged` directly.
- **Testing (ALWAYS via `yarn ai:test`)**: When verifying logic, run `yarn ai:test` with no args (auto-detects changed files, maps to colocated `*.spec.ts`, runs the owning Nx project). Never run broad test suites or `yarn nx test` directly.
- **Worktree Hygiene (via `yarn ai:worktree:audit`)**: When accumulating git worktrees across agent tools (T3, Gemini, OpenCode), audit with `yarn ai:worktree:audit` (`--all-repos` for every repo). Destructive flags (`--delete-orphans`, `--delete-merged`, `--clear-node-modules`, `--remove`) require explicit user approval per section 3 — never run them unprompted.

## 5. Pull Request Creation & PR Template Compliance

- **Approval Prohibition**: **NEVER** commit, push to remote origin, create a non-draft PR, or convert a PR out of draft without explicit user approval.
- **Mandatory PR Template Usage**: Whenever creating or updating a pull request description, you **MUST ALWAYS** follow the project PR template located at `.github/pull_request_template.md`:
  - Fill out `## Developer Summary` with reviewer notes, pain points, or architectural summaries.
  - Fill out `## Related Issues` linking issues with `Closes #[issue_number]`, `Relates to #[issue_number]`, or `Part of Epic #[epic_number]`.
  - Include `## Screenshots / Videos` when visual or UI changes are made.
  - **Preserve PR-Agent AI Summary Block**: Never delete or replace the `---` separator or the `## AI Summary` block (`pr_agent:summary`, `pr_agent:walkthrough`, `pr_agent:diagram`). PR-Agent relies on these exact markers to auto-generate and regenerate descriptions via `/describe`.
