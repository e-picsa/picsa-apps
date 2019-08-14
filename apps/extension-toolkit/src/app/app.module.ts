import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { MobxAngularModule } from 'mobx-angular';
import {
  PicsaDbModule,
  PicsaNativeModule,
  PicsaTranslateModule
} from '@picsa/modules';
import { IonicModule } from '@ionic/angular';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MobxAngularModule,
    PicsaDbModule.forRoot(),
    PicsaNativeModule.forRoot(),
    PicsaTranslateModule.forRoot(),
    AppRoutingModule,
    IonicModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
