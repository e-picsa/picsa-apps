import { ErrorHandler, inject, Injectable } from '@angular/core';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';

@Injectable({ providedIn: 'root' })
export class DashboardErrorHandler implements ErrorHandler {
  private notificationService = inject(PicsaNotificationService);

  constructor() {
    // Ensure errors handled if thrown globally
    // https://github.com/angular/angular/issues/56240
    window.addEventListener('unhandledrejection', (e) => {
      if (this.isAppError(e.reason)) {
        this.handleError(e.reason);
        e.preventDefault();
      }
    });
    window.addEventListener('error', (event) => {
      if (this.isAppError(event.error, event.filename)) {
        this.handleError(event.error);
        event.preventDefault();
      }
    });
  }

  private isAppError(error: any, filename?: string): boolean {
    if (!error) return false;

    const stack = error?.stack || '';
    const message = typeof error === 'string' ? error : error?.message || '';

    // 1. Ignore browser extension content scripts (Chrome, Firefox, Safari)
    if (/chrome-extension:|moz-extension:|safari-extension:/i.test(stack || filename || '')) {
      return false;
    }

    // 2. Ignore known extension/DevTools noise
    if (message.includes('Angular DevTools') || message.includes('Angular debugging APIs')) {
      return false;
    }

    // 3. If filename exists and belongs to external domain (e.g. analytics CDN), ignore
    if (filename && filename.startsWith('http') && !filename.includes(window.location.origin)) {
      return false;
    }

    return true;
  }

  handleError(error: any) {
    if (!this.isAppError(error)) return;

    const message = typeof error === 'string' ? error : error?.message || 'An unexpected error occurred';
    console.error(error);
    this.notificationService.showErrorNotification(message);
  }
}
