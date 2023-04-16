/* eslint-disable @nrwl/nx/enforce-module-boundaries */
import { Component } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { BUDGET_ICONS } from '@picsa/budget/src/app/app.component';
import { CLIMATE_ICONS } from '@picsa/climate/src/app/app.component';
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
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    analyticsService: AnalyticsService,
    router: Router,
    crashlyticsService: CrashlyticsService,
    performanceService: PerformanceService
  ) {
    this.registerIcons();
    performanceService.setEnabled({ enabled: ENVIRONMENT.production });
    if (ENVIRONMENT.production) {
      analyticsService.init(router);
    }
    if (Capacitor.isNativePlatform()) {
      crashlyticsService.init();
    }
  }

  // Note, any icons registered in child modules will also need to be registered here
  // TODO - see if there is a better system for this
  registerIcons() {
    const icons = {
      ...CLIMATE_ICONS,
      ...BUDGET_ICONS,
      resources: 'resources',
      discussions: 'discussions',
      'data-collection': 'data-collection',
      'budget-tool': 'budget-tool',
      'climate-tool': 'climate-tool',
      whatsapp: 'whatsapp',
      play_store: 'play_store',
    };
    for (const [key, value] of Object.entries(icons)) {
      this.matIconRegistry.addSvgIcon(
        `picsa_${key}`,
        this.domSanitizer.bypassSecurityTrustResourceUrl(
          // NOTE - svgs are imported from shared lib (see angular.json for config)
          `assets/images/${value}.svg`
        )
      );
    }
  }
}
