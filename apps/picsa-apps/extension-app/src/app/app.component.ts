/* eslint-disable @nx/enforce-module-boundaries */
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ENVIRONMENT } from '@picsa/environments';
import { MonitoringToolService } from '@picsa/monitoring/src/app/services/monitoring-tool.service';
import { ResourcesToolService } from '@picsa/resources/src/app/services/resources-tool.service';
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
    private crashlyticsService: CrashlyticsService,
    private resourcesService: ResourcesToolService,
    private monitoringService: MonitoringToolService
  ) {
    this.init();
  }

  private async init() {
    this.performanceService.setEnabled({ enabled: ENVIRONMENT.production });
    this.crashlyticsService.ready().then(() => null);
    // eagerly enable analytics collection
    this.analyticsService.init(this.router);
    // eagerly load resources service to populate hardcoded resources
    this.resourcesService.ready();
    // eagerly load monitoring service to sync form data
    this.monitoringService.ready();
  }
}
