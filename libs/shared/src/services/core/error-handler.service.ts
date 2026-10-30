import { ErrorHandler, inject, Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import * as Sentry from '@sentry/angular';
import { fromError as getStacktraceFromError } from 'stacktrace-js';

import { CrashlyticsService } from './crashlytics.service';
import { isIgnoredErrorMessage } from './sentry.service';

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

    // Unwrap Angular/Zone.js wrapped error if present, then normalize error-like objects
    // (such as Angular HttpErrorResponse or Supabase PostgrestError) into Error instances
    // so Sentry does not group them under generic `Object captured as exception` titles.
    const unwrapped = (error as { ngOriginalError?: unknown })?.ngOriginalError || error;
    const extractedError = this.normalizeError(unwrapped);

    // Send to Sentry (captures JS exceptions across web and mobile webview)
    if (Sentry.isEnabled()) {
      Sentry.captureException(extractedError);
    }

    // Send to Firebase Crashlytics if running on native platform (excluding ignored client network drops)
    if (
      Capacitor.isNativePlatform() &&
      extractedError instanceof Error &&
      !isIgnoredErrorMessage(extractedError.message)
    ) {
      try {
        await this.crashlyticsService.ready();
        await this.logToCrashlytics(extractedError);
      } catch (err) {
        console.warn('[ErrorHandler] Failed to log to Crashlytics', err);
      }
    }
  }

  private normalizeError(error: unknown): unknown {
    if (error instanceof Error) {
      return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
      const candidate = error as { message?: unknown; name?: unknown };
      if (typeof candidate.message === 'string' && candidate.message.length > 0) {
        const normalized = new Error(candidate.message, { cause: error });
        if (typeof candidate.name === 'string' && candidate.name.length > 0) {
          normalized.name = candidate.name;
        }
        return normalized;
      }
    }
    return error;
  }

  private async logToCrashlytics(error: Error) {
    const stacktrace = await getStacktraceFromError(error);
    return this.crashlyticsService.recordException({
      message: error.message,
      stacktrace,
    });
  }
}
