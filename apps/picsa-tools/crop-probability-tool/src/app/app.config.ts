import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/i18n';
import { PicsaNativeModule } from '@picsa/shared/modules';

import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideRouter(appRoutes, withComponentInputBinding()),
    importProvidersFrom(PicsaNativeModule.forRoot(), PicsaTranslateModule.forRoot()),
  ],
};
