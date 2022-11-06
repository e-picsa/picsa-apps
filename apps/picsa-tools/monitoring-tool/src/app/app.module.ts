import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';

import {
  PicsaDbModule,
  PicsaTranslateModule,
  PicsaTranslateService,
} from '@picsa/shared/modules';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
// import { MonitoringMaterialModule } from './material.module';
import { PicsaCommonComponentsModule } from '@picsa/components';

/** Core imports only required when running standalone */
const StandaloneImports = [
  AppRoutingModule,
  BrowserModule,
  BrowserAnimationsModule,
  PicsaTranslateModule.forRoot(),
];

/** Common imports used in both standalone and embedded formats */
export const APP_COMMON_IMPORTS = [
  FormsModule,
  PicsaTranslateModule,
  // MonitoringMaterialModule,
  PicsaDbModule.forRoot(),
  PicsaCommonComponentsModule,
];

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
