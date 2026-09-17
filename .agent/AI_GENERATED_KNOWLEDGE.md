- In the outcome badge row, use flexbox `justify-between` and toggle `invisible` (`visibility: hidden`) with `[attr.aria-hidden]="!showRate"` on the rate label when $p \ge 0.05$ or rate is absent. This hides the numeric rate while maintaining consistent badge alignment to the right and preventing card height collapse.
- **4 Explicit Outcome Categories**:
  1. `upward_trend`: $p < 0.05$ and slope $> 0$.
  2. `downward_trend`: $p < 0.05$ and slope $< 0$.
  3. `no_clear_trend`: $p \ge 0.05$ (inconclusive).
  4. `insufficient_data`: fails sample size ($n < 20$) or completeness ratio ($< 70\%$).
- **Public Views**: Only **30-year view** (multidecadal normal) and **Full-record view** ($\ge 20$ usable years, $\ge 70\%$ completeness) are supported. 10-year view is removed from climate trend classification.
- **Precision & Rounding**:
  - Round all decadal rates of change and confidence intervals to the **nearest integer** (e.g. `+14 mm / decade`, `95% CI: [+3, +25] mm / decade`).
  - Exception: Temperature (`°C`) is formatted to **1 decimal place** (e.g. `+0.4 °C / decade`, `95% CI: [+0.1, +0.7] °C / decade`).
- **Goodness-of-Fit ($R^2$) Role**:
  - $R^2$ is provided purely as a descriptive measure of variance explained in the collapsible statistics panel.
  - In highly variable climate series (e.g. rainfall), low $R^2$ is common even when an important trend exists. $R^2$ is never used as an arbitrary gating threshold or styled as "failing".
- **Monthly Timespan Exclusion**: Trendline tools are strictly scoped to annual and seasonal indicators, hiding on monthly views where unadjusted seasonality would distort linear fits.

### Angular Material Component Conventions

- **Angular Material v21 Button Syntax**: Always use modern attribute directives (`<button matButton>`, `<button matButton="filled">`, `<button matIconButton>`). Never use legacy tag/attribute forms like `mat-button`, `mat-icon-button`, or `mat-flat-button`.

---

## 7. Error Handling & Monitoring Architecture

### Sentry & Firebase Crashlytics Dual-Reporting Strategy

- **Complementary Roles**:
  - **Sentry (`@sentry/angular`)**: Primary error tracking for TypeScript/JavaScript exceptions across both Web (PWA) and Mobile (Capacitor webview). Provides full source-mapped stack traces, device/platform tagging, release tracking, and breadcrumbs.
  - **Firebase Crashlytics**: Retained exclusively on Android for native OS-level crashes (via the Gradle plugin) and duplicate reporting of non-fatal exceptions via `CrashlyticsService.recordException`.
- **Initialization Timing**:
  - Sentry is initialized in `apps/picsa-apps/app/src/main.ts` via `initSentry()` _prior_ to `bootstrapApplication()` so early bootstrap and bundling failures are reported.
  - `bootstrapApplication(...).catch(...)` explicitly forwards unhandled bootstrap rejections to Sentry.
- **Central Exception Routing (`ErrorHandlerService`)**:
  - `ErrorHandlerService` overrides Angular's `ErrorHandler.handleError(error)`.
  - Automatically unwraps Angular/Zone.js errors (`(error as any)?.ngOriginalError || error`).
  - Dispatches to `Sentry.captureException(...)` when Sentry is enabled.
  - On native Android (`Capacitor.isNativePlatform()`), additionally dispatches to `crashlyticsService.recordException(...)` in a protected try/catch block.
  - Always calls `super.handleError(error)` to preserve local console output.
- **Inbound Noise Filtering & Quota Protection**:
  - In `beforeSend`, errors originating from browser extensions (`chrome-extension:`, `moz-extension:`, `safari-extension:`) or Angular DevTools messaging hooks are discarded to avoid burning monthly event quotas.
  - Sentry is enabled in production builds by default (`ENVIRONMENT.production`), with optional explicit overrides via `ENVIRONMENT.sentry.enabled`.
- **Production Sourcemaps & CI Release Ingestion**:
  - `apps/picsa-apps/app/project.json` configures `sourceMap: { "scripts": true, "styles": false, "hidden": true }` for production. `hidden: true` emits `.map` files on disk for debug symbolication while omitting `//# sourceMappingURL=` comments from bundles.
  - In release workflows (`web-release.yml` and `android-release.yml`), `sentry-cli sourcemaps inject` stamps bundles with deterministic Debug IDs and `sentry-cli sourcemaps upload` uploads them to Sentry.
  - `.map` files are deleted before hosting deployment or Capacitor sync (`find dist -name "*.map" -delete`) to prevent shipping source files to users or bundling them into native Android binaries.
- **Jest Mocking Gotcha (`@capacitor/core`)**:
  - When mocking `@capacitor/core` in unit tests, always spread `jest.requireActual('@capacitor/core')` (`{ ...actual, Capacitor: { ...actual.Capacitor, isNativePlatform: jest.fn() } }`). `@capacitor/device` calls `core.registerPlugin` during module evaluation; completely overwriting `@capacitor/core` without `registerPlugin` causes `TypeError: core.registerPlugin is not a function`.
