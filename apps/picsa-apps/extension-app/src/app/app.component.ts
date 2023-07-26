/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ENVIRONMENT } from '@picsa/environments';
import { AnalyticsService } from '@picsa/shared/services/core/analytics.service';
import { CompatibilityService } from '@picsa/shared/services/core/compatibility.service';
import { CrashlyticsService } from '@picsa/shared/services/core/crashlytics.service';
import { PerformanceService } from '@picsa/shared/services/core/performance.service';

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
    performanceService: PerformanceService,
    compatibilityService: CompatibilityService,
    crashlyticsService: CrashlyticsService
  ) {
    performanceService.setEnabled({ enabled: ENVIRONMENT.production });
    if (ENVIRONMENT.production) {
      analyticsService.init(router);
    }
    crashlyticsService.ready().then(() => null);

    compatibilityService.checkDeviceCompatibility().then((res) => {
      console.log('compatibility', res);
    });
  }
}
