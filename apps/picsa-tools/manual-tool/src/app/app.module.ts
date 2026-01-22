import { inject, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule, NoopAnimationsModule } from '@angular/platform-browser/animations';
import { PicsaCommonComponentsModule } from '@picsa/components';
import { PicsaTranslateModule, PicsaTranslateService } from '@picsa/i18n';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { ManualToolMaterialModule } from './components/material.module';

/** Core imports only required when running standalone */
const StandaloneImports = [
  AppRoutingModule,
  BrowserModule,
  BrowserAnimationsModule,
  NoopAnimationsModule,
  PicsaTranslateModule.forRoot(),
];

/** Common imports used in both standalone and embedded formats */
export const APP_COMMON_IMPORTS = [ManualToolMaterialModule, PicsaTranslateModule, PicsaCommonComponentsModule];

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
