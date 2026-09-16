# Agent Guide for Picsa Monorepo

## High-Level Context

This is a large Angular 21 / Nx 22 monorepo using Capacitor 7 for mobile.
The architecture consists of a "Super App" (`apps/picsa-apps/app`) that acts as a shell for multiple distinct modules/tools.

> [!IMPORTANT]
> **Use Yarn for all commands.**
> Always prefix `nx` commands with `yarn`, e.g., `yarn nx lint components`.

## Detailed Context

Please refer to the following files in `.agent/rules/` for deep context:

- **[Codebase Map](.agent/codebase-map.md)**: Architecture, directory structure, and relationship between the Super App and tools.
- **[Generated Symbol Map](.agent/generated-repo-map.md)**: Automatically generated symbol graph, `@picsa/*` path aliases, and component/service declarations. Run `yarn ai:gen-codemap` to update.
- **[Tech Stack](.agent/rules/tech-stack.md)**: Detailed stack info, constraints (MobX, Tailwind preferences), and library versions.
- **[Best Practices](.agent/skills/angular/SKILL.md)**: Guidelines for modern Angular 21 development (Signals, Control Flow, Standalone).
- **[Testing](.agent/rules/testing.md)**: Instructions for running and writing tests (Jest/Cypress).
- **[UI & Theming](.agent/skills/ui-theming/SKILL.md)**: detailed Tailwind CSS usage guidelines, including semantic color usage and theming best practices.
- **[PR Feedback Resolution](.agent/skills/address-pr-feedback/SKILL.md)**: Guidelines and triage matrix for resolving automated and human PR feedback without re-work loops.

## Core Principles

- **Offline-First**: assume unreliable connectivity. Use RxDB/Dexie.
- **OnPush Change Detection**: Strictly enforced.
- **Tailwind CSS**: Preferred over custom SCSS.
- **Internationalization (i18n)**: assume 20+ languages. NEVER hardcode user-facing text. Always use the `translate` pipe or appropriate service.

## Coding Style & Long-Term Maintainability

- **Long-Term Maintainability & Flat Architecture**:
  - Keep code structures flat, clean, and maintainable over time.
  - **Avoid deeply nested code** (such as nested `if`/`else` branches, nested ternaries, or sprawling callback trees) when handling edge cases or complex conditions.
  - Use **early returns**, **guard clauses**, and **isolated helper functions** to handle validations, degenerate inputs, and edge cases before executing core logic.
  - Prefer declarative dictionaries/lookup maps over sprawling `switch`/`if-else` blocks where applicable.
  - Use **tailwind** for styling, avoid complicated and nested scss. To avoid style repetition you may still use classes with tailwind `@apply` utility, however be sparing with this to avoid large css build (view encapsulation will repeat tailwind rules in built output).
- **Comments**: Do NOT leave internal monologue, questions, or reasoning in code comments (e.g., `// Wait, actually...`). Comments should only explain "why" the code does something if it's not obvious, or "what" complex logic establishes.

## Agent Meta-Instructions

This file (`AGENTS.md`) is symlinked to `.cursorrules`, `gemini.md`, and other IDE-specific instruction files to ensure automatic context ingestion across all agentic tools (Gemini, Cursor, OpenCode, Copilot, etc.).
**IMPORTANT**:

1. These rule files are the **SAME FILE**. Do not read more than one of them to conserve context window.
2. You **MUST** still reference the detailed documentation files in the `.agent/rules/` folder (e.g., `codebase-map.md`, `tech-stack.md`) when relevant to your task. These provide essential project-specific "Rules".

### Worktree Initialisation (Run First in New Worktrees)

- **Check the fingerprint first**: if `.ai-worktree-setup.json` exists at the repo root, setup already ran — skip this section.
- **Otherwise run setup immediately, before any other command**: `node tools/ai/ai-worktree-setup.mjs`. It installs dependencies via `yarn install --immutable` and copies git-ignored local files (env configs, `google-services.json`, supabase config) from the main checkout into the worktree.
- **Do NOT run `yarn install` directly** — the setup script covers the install plus the env/config copy, and writes the `.ai-worktree-setup.json` fingerprint that automated clients use to detect completed setup.
- If setup fails, resolve the blocker and re-run (with `--force` if a partial fingerprint exists). The script never overwrites existing worktree files unless `--overwrite` is passed.

### Planning Mode Requirements

- **Respect Planning Mode in all cases**: Avoid making code changes without presenting a plan and receiving explicit approval, unless explicitly given permission to do so by the user. This ensures strict adherence to the planning workflow across all tasks.

### Verification Protocol (STRICT: Targeted Lint & Test First, No Redundant Builds)

To conserve context tokens and runtime, agents **MUST NOT** execute full application builds (`yarn build`, `yarn nx build`, `nx build`, `picsa-apps-app-native:build`) after making code changes. App builds run full AOT passes, bundle native Capacitor layers, and flood the context window with thousands of tokens of build logs.

1. **Linting (ALWAYS via `yarn ai:lint`)**:
   - After modifying files, run `yarn ai:lint` with no args. It auto-detects all files changed vs `HEAD` (staged + unstaged + untracked — no staging required), applies `prettier --write`, then `eslint --fix`.
   - To lint specific files: `yarn ai:lint <path/to/file.ts> [...]`.
   - Do NOT run `yarn nx lint <project>`, bare `eslint`, `prettier`, or `lint-staged` directly — `yarn ai:lint` already covers them in the correct order.
   - Avoid linting massive shells like `picsa-apps-app-native` via `nx lint`.
2. **Testing (ALWAYS via `yarn ai:test`)**:
   - When verifying logic changes, run `yarn ai:test` with no args. It auto-detects changed files vs `HEAD`, maps each to its colocated `*.spec.ts`, and runs `yarn nx test <project> --testFile=<spec>` for the owning project.
   - **DO NOT run tests for template-only or style-only changes**: If your edits are strictly to templates (`*.html`), styles (`*.scss`, `*.css`, Tailwind classes), or markup formatting with no TypeScript logic or utility alterations, do NOT run test commands. Running tests for style/markup changes wastes tokens, slows down execution, and risks looping.
   - To test specific files: `yarn ai:test <path/to/file.ts> [...]` (source or spec paths both work).
   - **ONLY** run specs covering code you created or modified. **NEVER** run broad project test suites or tests across the general codebase.
   - Do NOT run `yarn nx test` directly — `yarn ai:test` resolves the project and `--testFile` for you.
3. **When Builds Are Permitted**:
   - ONLY run `yarn nx build` if explicitly requested by the user, or when modifying core bundler or Capacitor native configurations that cannot be validated via linting.

### Tool Usage Requirements (Crucial for Context Preservation)

To avoid overloading the context window and consuming excessive tokens, all AI/Agent assistants (regardless of the IDE) MUST adhere to the following file-reading constraints:

- **Prioritize Native IDE Tools**: You MUST use your native, built-in tools for file exploration over standard terminal commands whenever possible.
  - Use your native `view_file` or `read_file` tools instead of terminal commands like `cat`, `type`, or `Get-Content`.
  - Use your native `grep_search` or IDE-provided search capabilities instead of `grep`, `findstr`, or `Select-String`.
  - Use your native directory listing tools (e.g., `list_dir`) instead of `ls` or `dir`.
- **Reasoning**: Terminal commands output uncontrolled whitespace, shell formatting, and potentially massive file dumps without safeguards, whereas native tools are specifically optimized for LLM token efficiency and have built-in safety caps.

## Self-Documentation & Codebase Knowledge Maintenance

As an intelligent agent, you are responsible for maintaining the project's institutional memory in `.agent/AI_GENERATED_KNOWLEDGE.md`.

1. **Consult Before Acting**: Check `.agent/AI_GENERATED_KNOWLEDGE.md` for known gotchas (runtime incompatibilities, Supabase triggers, bundler traps, offline quirks) relevant to your task.
2. **When to Add Knowledge (High Quality Threshold)**:
   Add or update an entry ONLY if you encounter a non-obvious trap, unexpected runtime behavior, or codebase-specific constraint that:
   - Caused unexpected failures or required non-trivial debugging.
   - General AI training or static typing would likely get wrong.
   - Is specific to this codebase's architecture, tooling, or business domain.
3. **What NOT to Add (Strictly Prohibited)**:
   - ❌ **No Work Logs / Changelogs**: Do NOT record PR summaries or "what I did today".
   - ❌ **No General Programming Advice**: Do NOT add generic advice ("write small functions", "add unit tests").
   - ❌ **No Duplicate Rules**: If a rule belongs in `tech-stack.md`, `testing.md`, or a `SKILL.md`, put it there.
   - ❌ **No External Repo Specs**: Do NOT record specs or notes for external/other repositories.
   - ❌ **No Incomplete/Test Stubs**: Never commit verification or empty placeholder entries.
4. **Structure & Curation**:
   - Do NOT append chronological journal entries (`Date: YYYY-MM-DD`, `Context: ...`).
   - Group knowledge under the appropriate **topical section** (e.g., _Multi-Runtime & Bundling_, _Supabase & Triggers_, _Angular & Reactive State_, _Charts & SVG_, _Domain Logic_).
   - If a fix makes an existing gotcha obsolete, **prune or update** the existing section instead of letting dead knowledge accumulate.
5. **Regenerate Codebase Map on Structural Additions**:
   - **When to regenerate**: Do NOT run `yarn ai:gen-codemap` for minor bug fixes or method updates. ONLY regenerate when creating new structural elements that require extraction:
     - New `@picsa/*` libraries or TypeScript path aliases in `tsconfig.base.json`.
     - New Angular services (`@Injectable`), components (`@Component`), directives (`@Directive`), or pipes (`@Pipe`).
     - New Supabase edge functions (`apps/picsa-server/supabase/functions/`), server utils, or database SQL migrations (`apps/picsa-server/supabase/migrations/*.sql`).
     - New tools in `apps/picsa-tools/` or deployable apps in `apps/picsa-apps/`.
   - **Verify & Maintain Extraction Script**: After running `yarn ai:gen-codemap`, check `.agent/generated-repo-map.md` to confirm the new files/symbols were extracted correctly. If the script (`apps/picsa-scripts/src/generate-repo-map.ts`) missed your new code (e.g. due to an unhandled file extension, glob pattern, or AST structure), update `generate-repo-map.ts` to support it and re-run `yarn ai:gen-codemap`.
