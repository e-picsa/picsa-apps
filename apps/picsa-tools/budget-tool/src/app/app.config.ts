import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';

import { BUDGET_ROUTES } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(BUDGET_ROUTES, withComponentInputBinding())],
};
