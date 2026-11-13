import { provideHttpClient } from '@angular/common/http';
import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { PicsaTranslateModule } from '@picsa/i18n';
import { PicsaNativeModule } from '@picsa/shared/modules';

import { BUDGET_ROUTES } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(BUDGET_ROUTES, withComponentInputBinding()),
    provideHttpClient(),
    importProvidersFrom(PicsaTranslateModule.forRoot(), PicsaNativeModule.forRoot()),
  ],
};
