# Testing Guide

## Test Runners

- **Unit Tests**: Jest
- **E2E Tests**: Cypress (Web) / WebdriverIO (Native)

## Running Tests

> [!NOTE]
> Always use `yarn` to run test commands.

### Unit Tests (Targeted File Execution ONLY)

> [!IMPORTANT]
> **Agents MUST ONLY execute tests directly covering files they have created or modified (or newly created/modified spec files).**
> Do **NOT** run tests against entire projects or the general codebase, as this wastes tokens, executes hundreds of unrelated specs, and consumes minutes.
> **ALWAYS use `yarn ai:test` — never run `yarn nx test` directly.**

```bash
# Auto-detect changed files, map to colocated specs, run owning Nx projects:
yarn ai:test

# Or target specific files (source or spec paths both work):
yarn ai:test libs/utils/climate.utils.ts
```

`yarn ai:test` resolves each file to its colocated `*.spec.ts` and runs
`yarn nx test <project> --testFile=<spec>` for you.

### E2E Tests

> [!WARNING]
> Only run E2E tests when explicitly instructed by the user.

```bash
yarn nx e2e <project-name-e2e>
# Example
yarn nx e2e picsa-apps-dashboard-e2e
```

## Testing Standards

### Unit Tests

- **Coverage**: Focus on Services, State Management (MobX stores), and complex Utilities.
- **Components**: Test logic-heavy components; avoid testing simple display logic heavily if covered by E2E.
- **Mocks**: Use `jest.mock` or dependency injection to mock Supabase/local DB calls.

### E2E Tests

- Focus on critical user journeys (Login, Data Entry, Sync).
- Mock network requests where possible to ensure stability, unless testing the integration itself.
