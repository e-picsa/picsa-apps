import { ErrorHandler, inject,Injectable } from '@angular/core';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';

@Injectable({ providedIn: 'root' })
export class DashboardErrorHandler implements ErrorHandler {
  private notificationService = inject(PicsaNotificationService);

  constructor() {
    // Ensure errors handled if thrown globally
    // https://github.com/angular/angular/issues/56240
    window.addEventListener('unhandledrejection', (e) => {
      this.handleError(e.reason);
      e.preventDefault();
    });
    window.addEventListener('error', (event) => {
      this.handleError(event.error);
      event.preventDefault();
    });
  }

  handleError(error: Error) {
    console.error(error);
    this.notificationService.showErrorNotification(error.message);
  }
}
