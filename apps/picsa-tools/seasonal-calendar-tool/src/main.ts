import { importProvidersFrom } from '@angular/core';
import { bootstrapApplication, BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule, NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PicsaFormsModule } from '@picsa/forms';
import { PicsaTranslateModule } from '@picsa/i18n';
import { PicsaDb_V2_Module } from '@picsa/shared/modules';

import { AppComponent } from './app/app.component';
import { AppRoutingModule } from './app/app-routing.module';

const StandaloneImports = [
  AppRoutingModule,
  BrowserModule,
  BrowserAnimationsModule,
  NoopAnimationsModule,
  PicsaDb_V2_Module.forRoot(),
  PicsaFormsModule.forRoot(),
  PicsaTranslateModule.forRoot(),
];

bootstrapApplication(AppComponent, {
  providers: [importProvidersFrom(...StandaloneImports)],
}).catch((err) => console.error(err));
