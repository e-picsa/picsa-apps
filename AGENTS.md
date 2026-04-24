# Agent Guide for Picsa Monorepo

## High-Level Context

This is a large Angular 21 / Nx 22 monorepo using Capacitor 7 for mobile.
The architecture consists of a "Super App" (`apps/picsa-apps/app`) that acts as a shell for multiple distinct modules/tools.

> [!IMPORTANT]
> **Use Yarn for all commands.**
> Always prefix `nx` commands with `yarn`, e.g., `yarn nx build`.

## Detailed Context

Please refer to the following files in `.agent/rules/` for deep context:

- **[Codebase Map](.agent/codebase-map.md)**: Architecture, directory structure, and relationship between the Super App and tools.
- **[Tech Stack](.agent/rules/tech-stack.md)**: Detailed stack info, constraints (MobX, Tailwind preferences), and library versions.
- **[Best Practices](.agent/skills/angular/SKILL.md)**: Guidelines for modern Angular 21 development (Signals, Control Flow, Standalone).
- **[Testing](.agent/rules/testing.md)**: Instructions for running and writing tests (Jest/Cypress).
- **[UI & Theming](.agent/skills/ui-theming/SKILL.md)**: detailed Tailwind CSS usage guidelines, including semantic color usage and theming best practices.

## Core Principles

- **Offline-First**: assume unreliable connectivity. Use RxDB/Dexie.
- **OnPush Change Detection**: Strictly enforced.
- **Tailwind CSS**: Preferred over custom SCSS.
- **Internationalization (i18n)**: assume 20+ languages. NEVER hardcode user-facing text. Always use the `translate` pipe or appropriate service.

## Coding Style

- **Comments**: Do NOT leave internal monologue, questions, or reasoning in code comments (e.g., `// Wait, actually...`). Comments should only explain "why" the code does something if it's not obvious, or "what" complex logic establishes.

## Agent Meta-Instructions

This file (`AGENTS.md`) is symlinked to `.cursorrules`, `gemini.md`, and other IDE-specific instruction files to ensure automatic context ingestion across all agentic tools (Gemini, Cursor, OpenCode, Copilot, etc.).
**IMPORTANT**:

1. These rule files are the **SAME FILE**. Do not read more than one of them to conserve context window.
2. You **MUST** still reference the detailed documentation files in the `.agent/rules/` folder (e.g., `codebase-map.md`, `tech-stack.md`) when relevant to your task. These provide essential project-specific "Rules".

### Tool Usage Requirements (Crucial for Context Preservation)

To avoid overloading the context window and consuming excessive tokens, all AI/Agent assistants (regardless of the IDE) MUST adhere to the following file-reading constraints:

- **Prioritize Native IDE Tools**: You MUST use your native, built-in tools for file exploration over standard terminal commands whenever possible.
  - Use your native `view_file` or `read_file` tools instead of terminal commands like `cat`, `type`, or `Get-Content`.
  - Use your native `grep_search` or IDE-provided search capabilities instead of `grep`, `findstr`, or `Select-String`.
  - Use your native directory listing tools (e.g., `list_dir`) instead of `ls` or `dir`.
- **Reasoning**: Terminal commands output uncontrolled whitespace, shell formatting, and potentially massive file dumps without safeguards, whereas native tools are specifically optimized for LLM token efficiency and have built-in safety caps.

## Self-Documentation

As an intelligent agent, you are encouraged to improve your own workflow and help future agents.

1.  **Check Knowledge Base**: Before starting a task, check `.agent/AI_GENERATED_KNOWLEDGE.md` for learnings from previous sessions.
2.  **Record Learnings**: If you solve a particularly tricky problem or discover a useful pattern, append a new entry to `.agent/AI_GENERATED_KNOWLEDGE.md` following the format in that file.
