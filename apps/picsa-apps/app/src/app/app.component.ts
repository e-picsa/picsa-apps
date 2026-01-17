/* eslint-disable @nx/enforce-module-boundaries */
import { Component, effect, inject, Injector, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { ConfigurationService } from '@picsa/configuration';
import { APP_VERSION } from '@picsa/environments/src/version';
import { PicsaMigrationService } from '@picsa/migrations';
import { MonitoringToolService } from '@picsa/monitoring/src/app/services/monitoring-tool.service';
import { ResourcesToolService } from '@picsa/resources/services/resources-tool.service';
import { PicsaTranslateService } from '@picsa/shared/modules';
import { AnalyticsService } from '@picsa/shared/services/core/analytics.service';
import { AppUserService } from '@picsa/shared/services/core/appUser.service';
import { CrashlyticsService } from '@picsa/shared/services/core/crashlytics.service';
import { ErrorHandlerService } from '@picsa/shared/services/core/error-handler.service';
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
  private analyticsService = inject(AnalyticsService);
  private router = inject(Router);
  private performanceService = inject(PerformanceService);
  private crashlyticsService = inject(CrashlyticsService);
  private resourcesService = inject(ResourcesToolService);
  private monitoringService = inject(MonitoringToolService);
  private migrationService = inject(PicsaMigrationService);
  private appUpdateService = inject(AppUpdateService);
  private pushNotificationService = inject(PicsaPushNotificationService);
  private injector = inject(Injector);
  private appUserService = inject(AppUserService);
  private errorService = inject(ErrorHandlerService);
  private configurationService = inject(ConfigurationService);
  private translateService = inject(PicsaTranslateService);

  title = 'PICSA App';
  public ready = signal(false);
  public showLoader = signal(false);

  constructor() {
    effect(() => {
      const { language_code } = this.configurationService.userSettings();
      if (language_code) {
        this.translateService.setLanguage(language_code);
      }
    });
  }

  async ngOnInit() {
    // wait for migrations to run
    await this.runMigrations();

    // ensure service initialisation only occurs after migrations complete
    // and UI has chance to update
    await _wait(50);

    this.ready.set(true);

    this.loadEagerServices();
    this.loadDeferredServices();
  }

  public async showDebugInfo() {
    const { operatingSystem, osVersion, webViewVersion } = await Device.getInfo();
    const { identifier: device_id } = await Device.getId();
    const debugInfo = {
      app_version: APP_VERSION,
      user_id: this.appUserService.userId(),
      device_id,
      operatingSystem,
      osVersion,
      webViewVersion,
    };
    const debugText = JSON.stringify(debugInfo, null, 2);
    alert(debugText);
    try {
      navigator.clipboard.writeText(debugText);
    } catch (error) {
      //
    }
  }

  /** Load immediate services in background (non-blocking) */
  private loadEagerServices() {
    const ops = [
      // eagerly enable analytics collection
      this.analyticsService.init(this.router).catch((err) => this.errorService.handleError(err)),
      // eagerly load resources service to populate hardcoded resources
      this.resourcesService.ready().catch((err) => this.errorService.handleError(err)),
      // eagerly load monitoring service to sync form data
      this.monitoringService.ready().catch((err) => this.errorService.handleError(err)),
    ];
    Promise.allSettled(ops);
  }

  /** Load background services after timeout (non-blocking) */
  private async loadDeferredServices() {
    await _wait(2000);
    this.appUserService.enabled.set(true);
    // Native-only
    if (Capacitor.isNativePlatform()) {
      // async init
      const ops = [
        this.crashlyticsService.ready().catch((err) => this.errorService.handleError(err)),
        this.pushNotificationService.initializePushNotifications().catch((err) => this.errorService.handleError(err)),
        this.appUpdateService.checkForUpdates().catch((err) => this.errorService.handleError(err)),
      ];
      await Promise.allSettled(ops);
      // regular init
      try {
        this.performanceService.init();
      } catch (error) {
        this.errorService.handleError(error as any);
      }
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
