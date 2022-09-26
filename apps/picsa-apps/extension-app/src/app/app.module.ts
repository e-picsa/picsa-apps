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
import { PicsaCommonComponentsModule } from '@picsa/components';
import { ErrorHandlerService } from '@picsa/shared/services/core/error-handler.service';

@NgModule({
  declarations: [AppComponent],
  providers: [{ provide: ErrorHandler, useClass: ErrorHandlerService }],
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
  bootstrap: [AppComponent],
})
export class AppModule {}

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}
