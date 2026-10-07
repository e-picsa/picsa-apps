import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { PicsaNativeModule } from '@picsa/shared/modules';

import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(appRoutes, withComponentInputBinding()), importProvidersFrom(PicsaNativeModule.forRoot())],
};
