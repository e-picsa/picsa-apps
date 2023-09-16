/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ENVIRONMENT } from '@picsa/environments';
import { AnalyticsService } from '@picsa/shared/services/core/analytics.service';
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
    private analyticsService: AnalyticsService,
    private router: Router,
    private performanceService: PerformanceService,
    private crashlyticsService: CrashlyticsService
  ) {
    this.init();
  }

  private async init() {
    this.performanceService.setEnabled({ enabled: ENVIRONMENT.production });
    this.crashlyticsService.ready().then(() => null);
    if (ENVIRONMENT.production) {
      this.analyticsService.init(this.router);
    }
  }
}
