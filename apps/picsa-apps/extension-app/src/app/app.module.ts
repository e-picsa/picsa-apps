import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ErrorHandler } from '@angular/core';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { MobxAngularModule } from 'mobx-angular';
import {
  PicsaDbModule,
  PicsaDeepLinksModule,
  PicsaNativeModule,
  PicsaTranslateModule,
} from '@picsa/shared/modules';
import { IonicModule } from '@ionic/angular';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { PicsaCommonComponentsModule } from '@picsa/components';
import { ErrorHandlerService } from '@picsa/shared/services/core/error-handler.service';
import { PicsaAnimationsModule } from '@picsa/shared/features';

@NgModule({
  declarations: [AppComponent],
  providers: [{ provide: ErrorHandler, useClass: ErrorHandlerService }],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MobxAngularModule,
    PicsaDbModule.forRoot(),
    PicsaNativeModule.forRoot(),
    PicsaTranslateModule.forRoot(),
    PicsaDeepLinksModule.forRoot({
      baseUrl: 'https://picsa.app',
      appDynamicLink: 'https://picsa.page.link/dynamic',
    }),
    PicsaTranslateModule,
    PicsaAnimationsModule.forRoot(),
    PicsaCommonComponentsModule,
    HttpClientModule,
    AppRoutingModule,
    IonicModule.forRoot(),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}
