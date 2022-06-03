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
// NOTE - climate slider requires import into main modules
import { MatSliderModule } from '@angular/material/slider';
import 'hammerjs';
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
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MatSliderModule,
    HttpClientModule,
    MobxAngularModule,
    PicsaDbModule.forRoot(),
    PicsaNativeModule.forRoot(),
    PicsaTranslateModule.forRoot(),
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
