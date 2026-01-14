import { provideZoneChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import { PicsaExtensionContent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(PicsaExtensionContent, {
  ...appConfig,
  providers: [provideZoneChangeDetection(), ...appConfig.providers],
}).catch((err) => console.error(err));
