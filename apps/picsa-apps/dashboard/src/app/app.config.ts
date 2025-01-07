import { provideHttpClient } from '@angular/common/http';
import {
  ApplicationConfig,
  ErrorHandler,
  importProvidersFrom,
  provideExperimentalZonelessChangeDetection,
} from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { PicsaFormsModule } from '@picsa/forms';
import { PicsaTranslateModule } from '@picsa/shared/modules';
import { PicsaNotificationService } from '@picsa/shared/services/core/notification.service';

import { appRoutes } from './app.routes';
import { DashboardErrorHandler } from './modules/error-handler';

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    // provideExperimentalCheckNoChangesForDebug({
    //   interval: 1000, // run change detection every second
    //   useNgZoneOnStable: true, // run it when the NgZone is stable as well
    //   exhaustive: true,
    // }),
    provideRouter(appRoutes),
    provideAnimations(),
    provideHttpClient(),
    // Enable picsa forms and (global) translate module for lazy-loaded standalone components
    // https://angular.io/guide/standalone-components#configuring-dependency-injection
    importProvidersFrom(PicsaFormsModule, PicsaTranslateModule.forRoot()),
    {
      provide: ErrorHandler,
      useClass: DashboardErrorHandler,
      deps: [PicsaNotificationService],
    },
  ],
};
