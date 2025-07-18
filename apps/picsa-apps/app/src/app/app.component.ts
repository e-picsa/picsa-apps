/* eslint-disable @nx/enforce-module-boundaries */
import { Component, Injector, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { PicsaMigrationService } from '@picsa/migrations';
import { MonitoringToolService } from '@picsa/monitoring/src/app/services/monitoring-tool.service';
import { ResourcesToolService } from '@picsa/resources/services/resources-tool.service';
import { AnalyticsService } from '@picsa/shared/services/core/analytics.service';
import { CrashlyticsService } from '@picsa/shared/services/core/crashlytics.service';
import { PerformanceService } from '@picsa/shared/services/core/performance.service';
import { PicsaPushNotificationService } from '@picsa/shared/services/core/push-notifications.service';
import { AppUpdateService } from '@picsa/shared/services/native/app-update';
import { _wait } from '@picsa/utils';

@Component({
  selector: 'picsa-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  title = 'PICSA App';
  public ready = signal(false);
  public showLoader = signal(false);

  constructor(
    private analyticsService: AnalyticsService,
    private router: Router,
    private performanceService: PerformanceService,
    private crashlyticsService: CrashlyticsService,
    private resourcesService: ResourcesToolService,
    private monitoringService: MonitoringToolService,
    private migrationService: PicsaMigrationService,
    private appUpdateService: AppUpdateService,
    private pushNotificationService: PicsaPushNotificationService,
    private injector: Injector,
  ) {}

  async ngOnInit() {
    // wait for migrations to run
    await this.runMigrations();
    this.ready.set(true);

    // ensure service initialisation only occurs after migrations complete
    // and UI has chance to update
    await _wait(50);

    // eagerly enable analytics collection
    this.analyticsService.init(this.router);
    // eagerly load resources service to populate hardcoded resources
    this.resourcesService.ready();
    // eagerly load monitoring service to sync form data
    this.monitoringService.ready();
    this.ready.set(true);

    if (Capacitor.isNativePlatform()) {
      this.performanceService.init();
      this.crashlyticsService.ready();
      // check for available updates
      this.appUpdateService.checkForUpdates();
      // delay push notification as will prompt for permissions
      setTimeout(() => {
        this.pushNotificationService.initializePushNotifications();
      }, 1000);
    }
  }

  private async runMigrations() {
    let migrationsComplete = false;
    // Only show loader if migrations taking more than 500ms
    setTimeout(() => {
      this.showLoader.set(!migrationsComplete);
    }, 500);
    await this.migrationService.runMigrations(this.injector);
    migrationsComplete = true;
    this.showLoader.set(false);
  }
}
