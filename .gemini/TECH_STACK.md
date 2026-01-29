# Technology Stack & Constraints

## Core Frameworks

- **Angular**: v21+
- **Nx**: v22+ (Monorepo management)
- **Capacitor**: v7 (Native mobile wrapper)
- **TypeScript**: Strict mode enabled.

## Package Manager

> [!IMPORTANT]
> **Yarn** is the strictly required package manager.
> Do NOT use `npm` or `pnpm`.
> Always prefix Nx commands: `yarn nx <command>`

## Styling

- **Preference**: **Tailwind CSS**.
- **Legacy/Specifics**: SCSS is available but should be minimized in favor of utility classes.
- **Design System**: Use defined tokens for colors/spacing. Avoid magic numbers.

## State Management

- **Signals**: Angular Signals are encouraged for local component state or where they integrate well.
- **RxJS**: Heavily used for streams and event handling.
- **MobX**: Used via `mobx-angular` for legacy tools (e.g. budget-tool).

## Data & Backend

- **Supabase**: Primary backend (Auth, Database, Realtime).
- **Offline-First**:
  - **RxDB / Dexie**: Client-side storage.
  - Apps must function without network access.
  - Sync strategies handle data reconciliation.

## Code Quality

- **Linting**: ESLint + Prettier.
- **Imports**: `eslint-plugin-simple-import-sort` is enforced.
- **Change Detection**: `OnPush` is mandatory for all components.
