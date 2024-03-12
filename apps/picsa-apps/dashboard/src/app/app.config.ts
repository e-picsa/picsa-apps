import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { PicsaFormsModule } from '@picsa/forms';
import { PicsaTranslateModule } from '@picsa/shared/modules';

import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideAnimations(),
    provideHttpClient(),
    // Enable picsa forms and (global) translate module for lazy-loaded standalone components
    // https://angular.io/guide/standalone-components#configuring-dependency-injection
    importProvidersFrom(PicsaFormsModule, PicsaTranslateModule.forRoot()),
  ],
};
