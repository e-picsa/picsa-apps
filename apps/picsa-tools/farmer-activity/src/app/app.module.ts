import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule, NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PicsaCommonComponentsModule } from '@picsa/components';
import { PicsaDb_V2_Module, PicsaTranslateModule, PicsaTranslateService } from '@picsa/shared/modules';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { FarmerActivityComponentsModule } from './components/components.module';
import { FarmerActivityMaterialModule } from './components/material.module';
import { ActivityDetailsComponent } from './pages/activity-details/activity-details.component';

/** Core imports only required when running standalone */
const StandaloneImports = [
  AppRoutingModule,
  BrowserModule,
  BrowserAnimationsModule,
  NoopAnimationsModule,
  PicsaTranslateModule.forRoot(),
  PicsaDb_V2_Module.forRoot(),
];

/** Common imports used in both standalone and embedded formats */
export const APP_COMMON_IMPORTS = [
  HttpClientModule,
  FarmerActivityComponentsModule,
  FarmerActivityMaterialModule,
  PicsaTranslateModule,
  PicsaDb_V2_Module,
  PicsaCommonComponentsModule,
];

/*******************************************************************
 *  Standalone Version
 ******************************************************************/
@NgModule({
  declarations: [AppComponent, ActivityDetailsComponent],
  imports: [...StandaloneImports, ...APP_COMMON_IMPORTS],
  bootstrap: [AppComponent],
  schemas: [],
})
export class AppModule {
  // ensure translate service initialised
  constructor(public translate: PicsaTranslateService) {}
}
