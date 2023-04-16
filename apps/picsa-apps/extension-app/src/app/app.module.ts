import { HttpClient,HttpClientModule } from '@angular/common/http';
import { ErrorHandler,NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { IonicModule } from '@ionic/angular';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { PicsaCommonComponentsModule } from '@picsa/components';
import { PicsaAnimationsModule } from '@picsa/shared/features';
import {
  PicsaDbModule,
  PicsaDeepLinksModule,
  PicsaNativeModule,
  PicsaTranslateModule,
} from '@picsa/shared/modules';
import { ErrorHandlerService } from '@picsa/shared/services/core/error-handler.service';
import { MobxAngularModule } from 'mobx-angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

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
