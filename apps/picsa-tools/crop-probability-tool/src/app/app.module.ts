/* eslint-disable @nx/enforce-module-boundaries */
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule, NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PicsaCommonComponentsModule } from '@picsa/components';
import { PicsaDbModule, PicsaTranslateModule, PicsaTranslateService } from '@picsa/shared/modules';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

/** Core imports only required when running standalone */
const StandaloneImports = [
  AppRoutingModule,
  BrowserModule,
  BrowserAnimationsModule,
  NoopAnimationsModule,
  PicsaTranslateModule.forRoot(),
];

/** Common imports used in both standalone and embedded formats */
export const APP_COMMON_IMPORTS = [PicsaTranslateModule, PicsaDbModule.forRoot(), PicsaCommonComponentsModule];

/*******************************************************************
 *  Standalone Version
 ******************************************************************/
@NgModule({
  declarations: [AppComponent],
  imports: [...StandaloneImports, ...APP_COMMON_IMPORTS],
  bootstrap: [AppComponent],
  schemas: [],
})
export class AppModule {
  // ensure translate service initialised
  constructor(public translate: PicsaTranslateService) {}
}
