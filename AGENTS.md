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
- **[Best Practices](.agent/rules/angular.md)**: Guidelines for modern Angular 21 development (Signals, Control Flow, Standalone).
- **[Testing](.agent/rules/testing.md)**: Instructions for running and writing tests (Jest/Cypress).
- **[UI & Theming](.agent/rules/ui-theming.md)**: detailed Tailwind CSS usage guidelines, including semantic color usage and theming best practices.

## Core Principles

- **Offline-First**: assume unreliable connectivity. Use RxDB/Dexie.
- **OnPush Change Detection**: Strictly enforced.
- **Tailwind CSS**: Preferred over custom SCSS.

## Agent Meta-Instructions

This file (`AGENTS.md`) is symlinked to `.cursorrules` and `gemini.md` to ensure automatic context ingestion.
**IMPORTANT**:

1. `.cursorrules`, `gemini.md`, and `AGENTS.md` are the **SAME FILE**. Do not read more than one of them to conserve context window.
2. You **MUST** still reference the detailed documentation files in the `.agent/rules/` folder (e.g., `codebase-map.md`, `tech-stack.md`) when relevant to your task. These provide essential project-specific "Rules".

## Self-Documentation

As an intelligent agent, you are encouraged to improve your own workflow and help future agents.

1.  **Check Knowledge Base**: Before starting a task, check `.agent/AI_GENERATED_KNOWLEDGE.md` for learnings from previous sessions.
2.  **Record Learnings**: If you solve a particularly tricky problem or discover a useful pattern, append a new entry to `.agent/AI_GENERATED_KNOWLEDGE.md` following the format in that file.
