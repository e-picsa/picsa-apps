import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule, NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PicsaCommonComponentsModule } from '@picsa/components';
import { PicsaFormsModule } from '@picsa/forms';
import { PicsaDb_V2_Module, PicsaTranslateModule, PicsaTranslateService } from '@picsa/shared/modules';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { SeasonalCalendarMaterialModule } from './components/material.module';

/** Core imports only required when running standalone */
const StandaloneImports = [
  AppRoutingModule,
  BrowserModule,
  BrowserAnimationsModule,
  NoopAnimationsModule,
  PicsaDb_V2_Module.forRoot(),
  PicsaFormsModule.forRoot(),
  PicsaTranslateModule.forRoot(),
];

/** Common imports used in both standalone and embedded formats */
export const APP_COMMON_IMPORTS = [
  SeasonalCalendarMaterialModule,
  PicsaCommonComponentsModule,
  PicsaDb_V2_Module,
  PicsaFormsModule,
  PicsaTranslateModule,
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
