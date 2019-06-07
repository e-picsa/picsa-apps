import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { SocialSharing } from '@ionic-native/social-sharing/ngx';
import { IonicStorageModule } from '@ionic/storage';
import { NgReduxRouterModule } from '@angular-redux/router';
import { NgReduxModule } from '@angular-redux/store';
import { MobxAngularModule } from 'mobx-angular';
import { StoreModule } from '@picsa/core';
import { CanvasWhiteboardModule } from 'ng2-canvas-whiteboard';
import { DbModule } from '@picsa/core/db/db.module';
import { File } from '@ionic-native/file/ngx';
import { FileOpener } from '@ionic-native/file-opener/ngx';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PicsaMaterialModule } from './material.module';

// configure translation from file
export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, 'assets/i18n/', '.json');
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
    PicsaMaterialModule,
    IonicStorageModule.forRoot({
      name: '__picsa'
    }),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient]
      },
      isolate: false
    }),
    NgReduxModule,
    NgReduxRouterModule.forRoot(),
    MobxAngularModule,
    StoreModule,
    CanvasWhiteboardModule,
    DbModule
  ],
  exports: [TranslateModule],
  providers: [SocialSharing, File, FileOpener],
  bootstrap: [AppComponent]
})
export class AppModule {}
