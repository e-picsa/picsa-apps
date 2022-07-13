import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';

import { NgxYoutubePlayerModule } from 'ngx-youtube-player';

import {
  PicsaDbModule,
  PicsaNativeModule,
  PicsaTranslateModule,
  PicsaTranslateService,
} from '@picsa/shared/modules';

import { MobxAngularModule } from 'mobx-angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { ResourcesMaterialModule } from './material.module';
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
  NgxYoutubePlayerModule,
  PicsaTranslateModule,
  MobxAngularModule,
  ResourcesMaterialModule,
  PicsaDbModule.forRoot(),
  PicsaNativeModule.forRoot(),
  PicsaCommonComponentsModule,
];

/*******************************************************************
 *  Standalone Version
 ******************************************************************/
@NgModule({
  declarations: [AppComponent],
  imports: [...StandaloneImports, ...APP_COMMON_IMPORTS],
  bootstrap: [AppComponent],
})
export class AppModule {
  // ensure translate service initialised
  constructor(public translate: PicsaTranslateService) {}
}
