import { inject,NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// import { MonitoringMaterialModule } from './material.module';
import { PicsaCommonComponentsModule } from '@picsa/components';
import { PicsaDb_V2_Module, PicsaTranslateModule, PicsaTranslateService } from '@picsa/shared/modules';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

/** Core imports only required when running standalone */
const StandaloneImports = [
  AppRoutingModule,
  BrowserModule,
  BrowserAnimationsModule,
  PicsaTranslateModule.forRoot(),
  PicsaDb_V2_Module.forRoot(),
];

/** Common imports used in both standalone and embedded formats */
export const APP_COMMON_IMPORTS = [
  FormsModule,
  PicsaTranslateModule,
  // MonitoringMaterialModule,
  PicsaDb_V2_Module,
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
  translate = inject(PicsaTranslateService);
}
