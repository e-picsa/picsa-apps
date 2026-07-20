import { ErrorHandler, inject, Injectable } from '@angular/core';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';

/** Minimal structural interface to safely extract error properties */
interface ErrorWithStack {
  message?: string;
  stack?: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardErrorHandler implements ErrorHandler {
  private readonly notificationService = inject(PicsaNotificationService);

  constructor() {
    // Capture unhandled rejections outside Angular zone / zoneless
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      this.handleError(event.reason);
      // Optional: stop standard browser error logging if handled
      // event.preventDefault();
    });

    window.addEventListener('error', (event: ErrorEvent) => {
      this.handleError(event.error, event.filename);
      // Optional: stop standard browser error logging if handled
      // event.preventDefault();
    });
  }

  handleError(error: unknown, filename?: string): void {
    if (!this.isAppError(error, filename)) {
      return;
    }

    const message = this.extractErrorMessage(error);

    console.error(error);
    this.notificationService.showErrorNotification(message);
  }

  /**
   * Type guard / filter for valid application errors
   */
  private isAppError(error: unknown, filename?: string): boolean {
    if (error == null) {
      return false;
    }

    const errObj = typeof error === 'object' ? (error as ErrorWithStack) : null;
    const message = typeof error === 'string' ? error : (errObj?.message ?? '');
    const stack = errObj?.stack ?? '';

    // Combined stack + filename string for extension check
    const traceSource = `${stack} ${filename ?? ''}`;

    // 1. Ignore browser extension content scripts
    if (/(chrome|moz|safari)-extension:/i.test(traceSource)) {
      return false;
    }

    // 2. Ignore known extension/DevTools noise
    if (message.includes('Angular DevTools') || message.includes('Angular debugging APIs')) {
      return false;
    }

    // 3. Ignore external script origins (e.g., analytics CDNs)
    if (filename && filename.startsWith('http') && !filename.includes(window.location.origin)) {
      return false;
    }

    return true;
  }

  private extractErrorMessage(error: unknown): string {
    if (typeof error === 'string' && error.trim() !== '') {
      return error;
    }
    if (typeof error === 'object' && error !== null && 'message' in error) {
      const message = (error as { message: unknown }).message;
      if (typeof message === 'string' && message.trim() !== '') {
        return message;
      }
    }
    return 'An unexpected error occurred';
  }
}
