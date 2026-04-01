import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { ENVIRONMENT } from '@picsa/environments';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

if (ENVIRONMENT.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
