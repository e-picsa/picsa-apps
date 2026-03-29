import { importProvidersFrom } from '@angular/core';
import { bootstrapApplication, BrowserModule } from '@angular/platform-browser';
import { PicsaTranslateModule } from '@picsa/i18n';
import { PicsaDb_V2_Module } from '@picsa/shared/modules';

import { AppComponent } from './app/app.component';
import { AppRoutingModule } from './app/app-routing.module';

const StandaloneImports = [
  AppRoutingModule,
  BrowserModule,
  PicsaTranslateModule.forRoot(),
  PicsaDb_V2_Module.forRoot(),
];

bootstrapApplication(AppComponent, {
  providers: [importProvidersFrom(StandaloneImports)],
}).catch((err) => console.error(err));
