import { ErrorHandler, inject,Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { fromError as getStacktraceFromError } from 'stacktrace-js';

import { CrashlyticsService } from './crashlytics.service';

@Injectable({
  providedIn: 'root',
})
export class ErrorHandlerService extends ErrorHandler {
  private crashlyticsService = inject(CrashlyticsService);

  /**
   * Custom error handling. On web this uses the default error handling
   * (console logs and modal in dev mode, ignored in production), on android
   * this logs to firebase crashlytics
   */
  override async handleError(error: Error) {
    if (Capacitor.isNativePlatform()) {
      await this.crashlyticsService.ready();
      return this.logToCrashlytics(error);
    } else {
      super.handleError(error);
      return;
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
