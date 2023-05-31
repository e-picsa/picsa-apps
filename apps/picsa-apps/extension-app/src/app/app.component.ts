/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { ENVIRONMENT } from '@picsa/environments';
import { AnalyticsService } from '@picsa/shared/services/core/analytics.service';
import { PerformanceService } from '@picsa/shared/services/core/performance.service';
import { CrashlyticsService } from '@picsa/shared/services/native/crashlytics.service';

@Component({
  selector: 'picsa-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'extension-toolkit';

  constructor(
    analyticsService: AnalyticsService,
    router: Router,
    crashlyticsService: CrashlyticsService,
    performanceService: PerformanceService
  ) {
    performanceService.setEnabled({ enabled: ENVIRONMENT.production });
    if (ENVIRONMENT.production) {
      analyticsService.init(router);
    }
    if (Capacitor.isNativePlatform()) {
      crashlyticsService.init();
    }
  }
}
