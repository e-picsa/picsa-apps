# Testing Guide

## Test Runners

- **Unit Tests**: Jest
- **E2E Tests**: Cypress (Web) / WebdriverIO (Native)

## Running Tests

> [!NOTE]
> Always use `yarn` to run test commands.

### Unit Tests

```bash
yarn nx test <project-name>
# Example
yarn nx test picsa-apps-dashboard
```

### E2E Tests

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
