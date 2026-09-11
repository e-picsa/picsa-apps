# Testing Guide

## Test Runners

- **Unit Tests**: Jest
- **E2E Tests**: Cypress (Web) / WebdriverIO (Native)

## Running Tests

> [!NOTE]
> Always use `yarn` to run test commands.

### Unit Tests (Targeted File Execution ONLY)

> [!IMPORTANT]
> **Agents MUST ONLY execute tests against files they have created or modified.**
> Do **NOT** run tests against entire projects or the general codebase, as this wastes tokens, executes hundreds of unrelated specs, and consumes minutes.

Use the `--testFile` parameter to target only the specific spec file you created or changed:

```bash
# General pattern:
yarn nx test <project-or-lib> --testFile=<filename.spec.ts>

# Example for a specific tool:
yarn nx test picsa-tools-crop-probability-tool --testFile=crop-probability-tool.component.spec.ts

# Example for a specific library:
yarn nx test utils --testFile=climate.utils.spec.ts
```

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
