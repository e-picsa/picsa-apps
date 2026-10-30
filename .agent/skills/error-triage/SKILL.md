---
name: error-triage
description: Diagnoses, correlates, and resolves production errors from Sentry and Firebase Crashlytics with strict anti-band-aid rules and device-level cross-referencing.
---

# Production Error Triage (Sentry + Firebase Crashlytics)

This skill guides agents in systematically triaging, correlating, diagnosing, and resolving production runtime errors across **Sentry** (`@sentry/angular`) and **Firebase Crashlytics** (`@capacitor-firebase/crashlytics`).

---

## 1. Preflight & Credential Verification

Always verify credentials and tool connectivity before beginning a triage session:

```bash
yarn ai:triage --doctor
```

- If `SENTRY_AUTH_TOKEN` is missing, the doctor displays the exact link and required token scopes (`project:read, org:read, event:read`).
- If Crashlytics / BigQuery credentials are missing, the doctor explains how to enable the BigQuery integration in the Firebase Console.
- The CLI is completely non-blocking: if one provider is unconfigured, it continues diagnosing the other provider.

---

## 2. Priority Hierarchy & Triage Workflow

```bash
# 1. List top unresolved errors (ranked by fatal severity, affected users, and event count)
yarn ai:triage list

# Filter by platform or release if scoping to a recent update
yarn ai:triage list --platform android --release 5.18.1

# 2. Inspect the source-mapped stack trace, breadcrumbs, and tags
yarn ai:triage inspect <issue-id>
```

### Priority Matrix

1. **🚨 P0 — Fatal Native Android Crashes (Crashlytics)**:
   - Native Java/Kotlin unhandled exceptions in Capacitor plugins (PushNotifications, AppUpdate, FileOpener).
   - WebView process kills or Out-Of-Memory (`OutOfMemoryError`).
   - Must be prioritized because they terminate the application process entirely.
2. **⚠️ P1 — High-User-Impact Regressions (Sentry)**:
   - TypeScript/Angular exceptions in the active `APP_VERSION` affecting multiple users (`userCount > 5`).
3. **ℹ️ P2 — Low-Frequency / Single-Device Exceptions (Sentry)**:
   - Isolated occurrences or edge-case network disconnects.

---

## 3. Device-Level Cross-Referencing (`Device.getId()`)

In PICSA, both Sentry and Crashlytics record the exact same anonymous device identifier:

- `sentry.service.ts`: `Sentry.setUser({ id: identifier })` from `Device.getId()`.
- `crashlytics.service.ts`: `setUserId({ userId: uuid })` from `Device.getId()`.

When investigating a native crash from Crashlytics where a `user_id` or device UUID is known, query Sentry to view the user's Angular route navigation, UI clicks, and console breadcrumbs immediately preceding the native crash:

```bash
yarn ai:triage user <device-uuid>
```

---

## 4. Mandatory 3-Bucket Classification (Before Editing Code)

Before writing any code or proposing PRs, classify each examined issue into one of three distinct buckets:

### Bucket A: Actionable Code Bug

- **Criteria**: Stack trace maps to an in-app file in `libs/` or `apps/` with a deterministic failure mechanism (e.g., race condition in `PicsaAsyncService.ready()`, unhandled null during offline mode, or broken schema mapping).
- **Required Action**:
  1. Identify the root cause (not just the crashing line).
  2. Implement the fix cleanly in source.
  3. Write or update a colocated unit test in `*.spec.ts` that reproduces the failure state and proves the fix.
  4. Run `yarn ai:typecheck` and `yarn ai:test`.

### Bucket B: Inbound Noise or Environmental Error

- **Criteria**:
  - Browser extensions (`chrome-extension:`, `moz-extension:`).
  - Benign DevTools messages.
  - Client-side offline network dropouts (`Failed to fetch`, `NetworkError when attempting to fetch resource`).
  - WebKit/Blink internal resize or quota warnings.
- **Required Action**:
  - If it affects Sentry quota, add a pattern filter in `beforeSend` within `libs/shared/src/services/core/sentry.service.ts`.
  - Mute the issue in Sentry:
    ```bash
    yarn ai:triage ignore <issue-id>
    ```

### Bucket C: Insufficient Telemetry

- **Criteria**: Stack trace terminates in an opaque library or async callback without enough context to determine why the state was invalid.
- **Required Action**:
  - Enrich error context in the calling service using `SentryService.addBreadcrumb()` or `SentryService.setExtra()`.
  - Do **not** attempt speculative fixes.

---

## 5. Strict Anti-Band-Aid Rules

To maintain codebase health with minimal dev bandwidth, adhere strictly to these rules:

1. **NO Blind Optional Chaining (`?.`)**: Never "fix" an error by simply slapping `?.` on the property that crashed with `Cannot read properties of undefined` without proving _why_ it was undefined and verifying that downstream consumers can handle the missing data gracefully.
2. **NO Empty `try/catch` Swallowing**: Never wrap a failing block in an empty `try { ... } catch {}` just to silence Sentry. If an operation can fail expectedly (e.g. storage or network), catch it explicitly, log a warning or breadcrumb, and set appropriate fallback state.
3. **Colocated Spec Tests**: Every Bucket A bug fix must include a corresponding test in the colocated `*.spec.ts` file.

---

## 6. Verification & Knowledge Persistence

Once a fix is implemented:

1. `yarn ai:typecheck` (Verifies TypeScript and Angular HTML templates).
2. `yarn ai:test` (Runs affected Jest unit tests).
3. `yarn ai:lint` (Applies formatting and lint rules to touched files).
4. **Knowledge Persistence**: If the error revealed a non-obvious runtime trap, bundler boundary, or Capacitor quirk, append the learning to the appropriate section of `.agent/AI_GENERATED_KNOWLEDGE.md`.
