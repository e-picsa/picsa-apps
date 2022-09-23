import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler } from '@angular/core';


import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { MobxAngularModule } from 'mobx-angular';
import {
  PicsaDbModule,
  PicsaNativeModule,
  PicsaTranslateModule,
} from '@picsa/shared/modules';
import { IonicModule } from '@ionic/angular';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
//Sentry imports
import * as Sentry from '@sentry/capacitor'
import * as SentryAngular from '@sentry/angular'
import { SENTRY_CONFIG } from '@picsa/environments/src/sentry';


// NOTE - climate slider requires import into main modules
import { MatSliderModule } from '@angular/material/slider';
import 'hammerjs';
import { PicsaCommonComponentsModule } from '@picsa/components';

// Sentry error reporting
Sentry.init(SENTRY_CONFIG, SentryAngular.init);

export class SentryErrorHandler implements ErrorHandler {
  handleError(error) {
    Sentry.captureException(error.originalError || error);
    throw error;
  }
}
/**************************************************************
 *  Sentry error handler
 * ***************************************************************/
// import * as Sentry from 'sentry-cordova';
// import { SENTRY_CONFIG } from '@picsa/environments/sentry';
// Sentry.init(SENTRY_CONFIG);
// export class SentryIonicErrorHandler extends ErrorHandler {
//   override handleError(error) {
//     super.handleError(error);
//     try {
//       Sentry.captureException(error.originalError || error);
//     } catch (e) {
//       console.error(e);
//     }
//   }
// }



@NgModule({
  declarations: [AppComponent],
  providers: [
     { 
      provide: ErrorHandler, 
      useValue: SentryAngular.createErrorHandler({logErrors:true,showDialog:false}),
      useClass: SentryErrorHandler 
    },

  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatSliderModule,
    HttpClientModule,
    MobxAngularModule,
    PicsaDbModule.forRoot(),
    PicsaNativeModule.forRoot(),
    PicsaTranslateModule.forRoot(),
    PicsaTranslateModule,
    PicsaCommonComponentsModule,
    HttpClientModule,
    AppRoutingModule,
    IonicModule.forRoot(),
  ],
  // providers: [{ provide: ErrorHandler, useClass: SentryIonicErrorHandler }],
  bootstrap: [AppComponent],
})
export class AppModule {}

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}
