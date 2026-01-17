# Agent Guide for Picsa Monorepo

## Project Context

This is a large Angular monorepo managed with Nx. It supports multiple applications including the main `picsa-apps` (hybrid mobile/web), server functions, and various internal tools.
The project emphasizes modern best practices, offline-first capabilities, and long-term maintainability.

## Technology Stack

- **Framework**: Angular 21 (ESM, Signals, Standalone components preferred where applicable, though MobX is used).
- **Build System**: Nx 22+ (Webpack/Esbuild).
- **State Management**: `mobx-angular` (Reactive state management).
- **Data Layer**:
  - **Supabase**: Backend-as-a-Service (Auth, DB, Realtime).
  - **RxDB / Dexie**: Client-side offline-first databases.
- **Styling**: SCSS with TailwindCSS available.
- **Mobile**: Capacitor 7 (Ionic integration).
- **Testing**: Jest (Unit), Cypress (E2E).
- **Linting**: ESLint + Prettier.

## Architectural Patterns

### Monorepo Structure (Nx)

- **apps/**: Deployable applications.
  - `picsa-apps`: Main user-facing application.
  - `picsa-tools`: Internal tools (budget, climate, etc.).
  - `picsa-server`: server-side functions/logic.
- **libs/**: Shared libraries. Code should default to living here.
  - Structure by scope/feature: `libs/feature-*`, `libs/ui-*`, `libs/util-*`, `libs/data-*`.

### State Management

- Use **MobX** for complex state using `mobx-angular`.
- Avoid proprietary state management patterns if MobX handles it well.
- Reactive primitives should be pervasive.

### Change Detection

- **`OnPush`** is the default and should be strictly enforced.
- Components should rely on inputs or observables.

### Database & Offline

- The app is designed to work offline.
- **Do not** assume network availability default to offline-first strategies.
- Use `RxDB` or `Dexie` for local persistence.
- Sync logic handles data transfer when online.

## Development Guidelines

### Creating New Features

1.  **Modularize**: Create a new library in `libs/` if the feature is substantial or reusable.
2.  **Standalone**: Use Angular Standalone Components.
3.  **Strict Typing**: No `any`. Use strict interfaces and Zod schemas where appropriate (Zod is in package.json).

### Styling

- Use **SCSS** for component-specific encapsulation.
- Use **Tailwind** utility classes for layout, spacing, and typography to maintain consistency.
- Responsive design is critical (Mobile-first).

### Quality Assurance

- **Tests Requirements**:
  - Write Unit tests (Jest) for all services and complex components.
  - Update E2E tests (Cypress) for critical user flows.
- **Linting**:
  - Ensure `yarn lint` passes.
  - Respect the `eslint-plugin-simple-import-sort` ensuring imports are organized.

### Tools & Scripts

- Use `nx serve [app-name]` to run.
- Use `nx test [lib-name]` to test.
- Check `package.json` for specific tool start scripts (e.g., `start:budget`, `start:climate`).

## Common Tasks & Workflows

- **Dependency Updates**: When adding deps, check if they belong in root `package.json` or a specific lib.
- **Supabase Changes**: Database schema changes must be reflected in local types and migrations.
