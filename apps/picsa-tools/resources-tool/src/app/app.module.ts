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

import { PicsaCommonComponentsModule } from '@picsa/components';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { ResourceListComponent } from './components/resource-list/resource-list.component';
import { ResourceItemComponent } from './components/resource-item/resource-item.component';
import { ResourcesMaterialModule } from './material.module';

/** Core imports only required when running standalone */
const StandaloneImports = [
  AppRoutingModule,
  BrowserModule,
  BrowserAnimationsModule,
];

/** Common imports used in both standalone and embedded formats */
export const APP_COMMON_IMPORTS = [
  FormsModule,
  NgxYoutubePlayerModule,
  PicsaTranslateModule,
  PicsaCommonComponentsModule,
  MobxAngularModule,
  ResourcesMaterialModule,
  PicsaTranslateModule.forRoot(),
  // ComponentsModule,
  // ExtensionToolkitMaterialModule,

  // From budget tool, will likely remove

  PicsaDbModule.forRoot(),
  PicsaNativeModule.forRoot(),
  // HttpClientModule,
];

/*******************************************************************
 *  Standalone Version
 ******************************************************************/
@NgModule({
  declarations: [AppComponent, ResourceListComponent, ResourceItemComponent],
  imports: [...StandaloneImports, ...APP_COMMON_IMPORTS],
  bootstrap: [AppComponent],
})
export class AppModule {
  // ensure translate service initialised
  constructor(public translate: PicsaTranslateService) {}
}
