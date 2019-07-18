import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
// import into root component as used throughout app and don't want duplicate instances
import { PICSATranslateModule } from '@picsa/modules/translate';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule
    // PICSATranslateModule.forRoot()
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
