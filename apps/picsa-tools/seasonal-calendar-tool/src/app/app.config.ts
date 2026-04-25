import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { PicsaFormsModule } from '@picsa/forms';
import { PicsaTranslateModule } from '@picsa/i18n';
import { PicsaDb_V2_Module } from '@picsa/shared/modules';

import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    // Opt out of zone-js to fix issue supabase auth incompatibility (zoneJS polyfill of Navigator api)
    // https://github.com/supabase/supabase-js/issues/936
    provideZonelessChangeDetection(),
    // NOTE - provideExperimentalCheckNoChangesForDebug not good for debug here due to way
    // routerActive used to toggle nav sections (infinite loops triggered)
    provideRouter(appRoutes, withComponentInputBinding()),
    provideAnimations(),
    provideHttpClient(),
    // Enable picsa forms and (global) translate module for lazy-loaded standalone components
    // https://angular.io/guide/standalone-components#configuring-dependency-injection
    importProvidersFrom(PicsaFormsModule, PicsaTranslateModule.forRoot(), PicsaDb_V2_Module.forRoot()),
  ],
};
