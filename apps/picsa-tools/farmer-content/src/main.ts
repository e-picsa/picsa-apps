// import { bootstrapApplication } from '@angular/platform-browser';

// import { PicsaFarmerContent } from './app/app.component';
// import { appConfig } from './app/app.config';

// TODO - fix standalone implementation
// bootstrapApplication(PicsaFarmerContent, appConfig).catch((err) => console.error(err));

import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { ENVIRONMENT } from '@picsa/environments';

import { FarmerContentModule } from './app/app.module-embedded';

if (ENVIRONMENT.production) {
  enableProdMode();
}

platformBrowserDynamic()
  .bootstrapModule(FarmerContentModule)
  .catch((err) => console.error(err));
