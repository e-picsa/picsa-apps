import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { ENVIRONMENT } from '@picsa/environments';
import { APP_VERSION } from '@picsa/environments/src/version';
import * as Sentry from '@sentry/angular';

/**
 * Initializes Sentry for Angular (PWA and Capacitor webview).
 * Call early during application bootstrapping (e.g. in main.ts).
 */
export function initSentry(): void {
  const sentryConfig = ENVIRONMENT.sentry;
  if (!sentryConfig?.dsn) {
    return;
  }

  const isEnabled = sentryConfig.enabled ?? ENVIRONMENT.production;

  Sentry.init({
    dsn: sentryConfig.dsn,
    enabled: isEnabled,
    release: APP_VERSION,
    environment: ENVIRONMENT.production ? 'production' : 'development',
    // Inbound filters to drop browser extension and DevTools noise
    beforeSend(event) {
      const frames = event.exception?.values?.[0]?.stacktrace?.frames;
      if (frames) {
        const isExtension = frames.some(
          (frame) =>
            frame.filename?.includes('chrome-extension:') ||
            frame.filename?.includes('moz-extension:') ||
            frame.filename?.includes('safari-extension:'),
        );
        if (isExtension) {
          return null;
        }
      }

      // Ignore known extension/DevTools messages
      const message = event.message || event.exception?.values?.[0]?.value || '';
      if (message.includes('Angular DevTools') || message.includes('Angular debugging APIs')) {
        return null;
      }

      return event;
    },
    // Tracing sample rate (low sample rate in production, disabled in dev)
    tracesSampleRate: ENVIRONMENT.production ? 0.1 : 0,
  });

  const platform = Capacitor.getPlatform();
  Sentry.setTag('platform', platform);
  Sentry.setTag('isNative', Capacitor.isNativePlatform().toString());

  // Set anonymous device identifier if available
  Device.getId()
    .then(({ identifier }) => {
      if (identifier) {
        Sentry.setUser({ id: identifier });
      }
    })
    .catch(() => {
      // Non-critical if device id cannot be obtained
    });
}

@Injectable({
  providedIn: 'root',
})
export class SentryService {
  /**
   * Captures an exception and sends it to Sentry if initialized and enabled.
   */
  public captureException(
    error: unknown,
    captureContext?: Parameters<typeof Sentry.captureException>[1],
  ): string | undefined {
    if (Sentry.isEnabled()) {
      return Sentry.captureException(error, captureContext);
    }
    return undefined;
  }

  /**
   * Captures an informational or warning message and sends it to Sentry.
   */
  public captureMessage(
    message: string,
    captureContext?: Parameters<typeof Sentry.captureMessage>[1],
  ): string | undefined {
    if (Sentry.isEnabled()) {
      return Sentry.captureMessage(message, captureContext);
    }
    return undefined;
  }

  /**
   * Sets the user context for error tracking.
   */
  public setUser(user: Sentry.User | null): void {
    if (Sentry.isEnabled()) {
      Sentry.setUser(user);
    }
  }

  /**
   * Sets a custom tag for error context.
   */
  public setTag(key: string, value: string): void {
    if (Sentry.isEnabled()) {
      Sentry.setTag(key, value);
    }
  }

  /**
   * Sets custom extra data for error context.
   */
  public setExtra(key: string, extra: unknown): void {
    if (Sentry.isEnabled()) {
      Sentry.setExtra(key, extra);
    }
  }

  /**
   * Records a manual breadcrumb.
   */
  public addBreadcrumb(breadcrumb: Sentry.Breadcrumb): void {
    if (Sentry.isEnabled()) {
      Sentry.addBreadcrumb(breadcrumb);
    }
  }
}
