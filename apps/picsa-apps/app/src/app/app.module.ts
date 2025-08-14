/* eslint-disable @nx/enforce-module-boundaries */
import { HttpClient, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { PicsaCommonComponentsModule } from '@picsa/components';
import { PicsaAnimationsModule } from '@picsa/shared/features';
import { PicsaLoadingComponent } from '@picsa/shared/features/loading/loading';
import {
  PicsaDb_V2_Module,
  PicsaDbModule,
  PicsaDeepLinksModule,
  PicsaNativeModule,
  PicsaTranslateModule,
} from '@picsa/shared/modules';
import { ErrorHandlerService } from '@picsa/shared/services/core/error-handler.service';
import { MobxAngularModule } from 'mobx-angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AppLayoutComponent } from './components/layout';

@NgModule({
  declarations: [AppComponent],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    MobxAngularModule,
    PicsaDbModule.forRoot(),
    PicsaDb_V2_Module.forRoot(),
    PicsaNativeModule.forRoot(),
    PicsaTranslateModule.forRoot(),
    PicsaDeepLinksModule.forRoot({
      baseUrl: 'https://picsa.app',
      appDynamicLink: 'https://picsa.page.link/dynamic',
    }),
    PicsaLoadingComponent,
    PicsaTranslateModule,
    PicsaAnimationsModule.forRoot(),
    PicsaCommonComponentsModule,
    AppLayoutComponent,
    AppRoutingModule,
  ],
  providers: [{ provide: ErrorHandler, useClass: ErrorHandlerService }, provideHttpClient(withInterceptorsFromDi())],
})
export class AppModule {}

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}
