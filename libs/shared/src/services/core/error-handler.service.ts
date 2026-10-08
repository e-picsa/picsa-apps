import { ErrorHandler, inject, Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import * as Sentry from '@sentry/angular';
import { fromError as getStacktraceFromError } from 'stacktrace-js';

import { CrashlyticsService } from './crashlytics.service';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService extends ErrorHandler {
  private crashlyticsService = inject(CrashlyticsService);

  /**
   * Custom error handling.
   * - Reports to Sentry for uncaught JS errors on both web and mobile (Capacitor webview)
   * - Reports to Firebase Crashlytics on native platforms for non-fatal error logging
   * - Preserves standard Angular console error output
   */
  override async handleError(error: unknown): Promise<void> {
    super.handleError(error);

    // Unwrap Angular/Zone.js wrapped error if present
    const extractedError = (error as { ngOriginalError?: unknown })?.ngOriginalError || error;

    // Send to Sentry (captures JS exceptions across web and mobile webview)
    if (Sentry.isEnabled()) {
      Sentry.captureException(extractedError);
    }

    // Send to Firebase Crashlytics if running on native platform
    if (Capacitor.isNativePlatform() && extractedError instanceof Error) {
      try {
        await this.crashlyticsService.ready();
        await this.logToCrashlytics(extractedError);
      } catch (err) {
        console.warn('[ErrorHandler] Failed to log to Crashlytics', err);
      }
    }
  }

  private async logToCrashlytics(error: Error) {
    const stacktrace = await getStacktraceFromError(error);
    return this.crashlyticsService.recordException({
      message: error.message,
      stacktrace,
    });
  }
}
