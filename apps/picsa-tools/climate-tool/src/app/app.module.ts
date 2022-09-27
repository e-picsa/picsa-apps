import {
  BrowserModule,
  HammerGestureConfig,
  HammerModule,
  HAMMER_GESTURE_CONFIG,
} from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import {
  PicsaTranslateModule,
  PicsaTranslateService,
} from '@picsa/shared/modules/translate';
import { PicsaDbModule } from '@picsa/shared/modules/db.module';
import { PicsaCommonComponentsModule } from '@picsa/components';

/** Core imports only required when running standalone */
const StandaloneImports = [
  BrowserModule,
  BrowserAnimationsModule,
  AppRoutingModule,
  // required to recognize touch actions on climate tool mat-slider
  HammerModule,
];

/** Common imports used in both standalone and embedded formats */
export const APP_COMMON_IMPORTS = [
  PicsaTranslateModule.forRoot(),
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
  providers: [
    // required to recognize touch actions on climate tool mat-slider
    { provide: HAMMER_GESTURE_CONFIG, useClass: HammerGestureConfig },
  ],
})
export class AppModule {
  // ensure translate service initialised
  constructor(public translate: PicsaTranslateService) {}
}
