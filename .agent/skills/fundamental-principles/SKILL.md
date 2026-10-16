---
name: fundamental-principles
description: Core principles that must be applied to ALL tasks, including mandatory self-documentation and knowledge persistence at the end of workflows.
---

# Fundamental Principles

This skill defines the core meta-instructions that you must follow for **every** task you undertake in this workspace.

## 1. Auto-Knowledge Generation (Mandatory Task Finalization)

As an intelligent agent, you must improve your own workflow and help future agents by leaving a trail of knowledge.

**Before starting a new complex task:**

- ALWAYS check `.agent/AI_GENERATED_KNOWLEDGE.md` for learnings and context from previous sessions.

**At the end of EVERY complex task or when significant decisions are made:**

- You MUST automatically record your learnings.
- Do this by appending a new entry to `.agent/AI_GENERATED_KNOWLEDGE.md`.
- Document things like:
  - New established architectural patterns.
  - Tricky bugs you resolved and their root cause.
  - Workarounds or specific commands required to build/test successfully.

## 2. Core Coding Rules

- Do NOT leave internal monologue, questions, or reasoning in code comments (e.g., `// Wait, actually...`).
- Comments should only explain "why" the code does something if it's not obvious, or "what" complex logic establishes.
- **Database Exploration**: ALWAYS use the `supabase-db` MCP skill (`mcp_supabase-db_query`) when trying to introspect the Supabase database (e.g., viewing registered functions, checking schema, exploring tables). This is significantly more efficient and accurate than reading raw schema files using `grep_search` or `view_file`.

## 3. Destructive Commands (CRITICAL)

- **NEVER** run destructive terminal commands such as `git restore`, `git reset --hard`, `git checkout .`, `git clean -fd`, or `rm -rf` under any circumstances unless explicitly requested by the user.
- Even if attempting to undo a previous programmatic mistake, you must either manually revert the specific edits you made using file replacement tools, or explicitly ask the user for permission to execute a destructive `git` command to discard changes. This is to ensure you do not destroy uncommitted, in-progress work the user may have in their working directory.

## 4. Verification Workflow (No Redundant Builds or Broad Test Suites)

- **Strict Build Prohibition**: **NEVER** run full application builds (`yarn build`, `yarn nx build`) after editing code. Builds compile assets, run full AOT passes, and bundle native wrappers, which wastes tokens and minutes.
- **Linting (ALWAYS via `yarn ai:lint`)**: After modifying files, run `yarn ai:lint` with no args (auto-detects changed files vs `HEAD`, no staging required, applies `prettier --write` + `eslint --fix`). Never run `yarn nx lint`, bare `eslint`/`prettier`, or `lint-staged` directly.
- **Testing (ALWAYS via `yarn ai:test`)**: When verifying logic, run `yarn ai:test` with no args (auto-detects changed files, maps to colocated `*.spec.ts`, runs the owning Nx project). Never run broad test suites or `yarn nx test` directly.

## 5. Pull Request Creation & PR Template Compliance

- **Approval Prohibition**: **NEVER** commit, push to remote origin, create a non-draft PR, or convert a PR out of draft without explicit user approval.
- **Mandatory PR Template Usage**: Whenever creating or updating a pull request description, you **MUST ALWAYS** follow the project PR template located at `.github/pull_request_template.md`:
  - Fill out `## Developer Summary` with reviewer notes, pain points, or architectural summaries.
  - Fill out `## Related Issues` linking issues with `Closes #[issue_number]`, `Relates to #[issue_number]`, or `Part of Epic #[epic_number]`.
  - Include `## Screenshots / Videos` when visual or UI changes are made.
  - **Preserve PR-Agent AI Summary Block**: Never delete or replace the `---` separator or the `## AI Summary` block (`pr_agent:summary`, `pr_agent:walkthrough`, `pr_agent:diagram`). PR-Agent relies on these exact markers to auto-generate and regenerate descriptions via `/describe`.
