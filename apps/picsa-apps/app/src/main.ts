import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { ENVIRONMENT } from '@picsa/environments';
import { initSentry } from '@picsa/shared/services/core/sentry.service';
import * as Sentry from '@sentry/angular';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

if (ENVIRONMENT.production) {
  enableProdMode();
}

// Initialize Sentry error reporting for both web & mobile (Capacitor webview)
initSentry();

bootstrapApplication(AppComponent, appConfig).catch((err) => {
  console.error(err);
  if (Sentry.isEnabled()) {
    Sentry.captureException(err);
  }
});
