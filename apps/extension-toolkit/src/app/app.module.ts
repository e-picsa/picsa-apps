import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { MobxAngularModule } from 'mobx-angular';
import { PicsaDbModule, PicsaNativeModule } from '@picsa/modules';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    // RouterModule.forRoot([], { initialNavigation: 'enabled' })
    AppRoutingModule,
    AppRoutingModule,
    HttpClientModule,
    MobxAngularModule,
    PicsaDbModule.forRoot(),
    PicsaNativeModule.forRoot()
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
