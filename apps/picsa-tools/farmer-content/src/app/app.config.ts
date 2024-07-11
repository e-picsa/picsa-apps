import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { appRoutes } from './app.routes';

// NOTE - standalone bootstrap not currently in use
// (embedded using app module only to get tools working)
export const appConfig: ApplicationConfig = {
  providers: [provideRouter(appRoutes)],
};
// TODO - consider using APP_INITIALIZER provider to inject
// service routes if wanting to make available standalone
