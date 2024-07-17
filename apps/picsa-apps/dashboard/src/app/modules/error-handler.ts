import { ErrorHandler, Injectable } from '@angular/core';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';

@Injectable({ providedIn: 'root' })
export class DashboardErrorHandler extends ErrorHandler {
  constructor(private notificationService: PicsaNotificationService) {
    super();
  }

  override handleError(error: Error) {
    console.error(error);
    this.notificationService.showErrorNotification(error.message);
    super.handleError(error);
  }
}
