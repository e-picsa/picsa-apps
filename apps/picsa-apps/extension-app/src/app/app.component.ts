/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ENVIRONMENT } from '@picsa/environments';
import { DeviceSupportService } from '@picsa/shared/modules/device-support';
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

  public showUI = false;

  constructor(
    private analyticsService: AnalyticsService,
    private router: Router,
    private performanceService: PerformanceService,
    private deviceSupport: DeviceSupportService,
    private crashlyticsService: CrashlyticsService
  ) {
    this.init();
  }

  private async init() {
    this.performanceService.setEnabled({ enabled: ENVIRONMENT.production });
    this.crashlyticsService.ready().then(() => null);
    await this.deviceSupport.runDeviceTroubleshooter();
    if (ENVIRONMENT.production) {
      this.analyticsService.init(this.router);
    }
    console.log('showing ui');
    this.showUI = true;

    // TODO - only show main display after troubleshooter closed?
  }
}
