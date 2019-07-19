import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { PicsaTranslateModule } from '@picsa/modules/translate';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, AppRoutingModule, PicsaTranslateModule.forRoot()],
  bootstrap: [AppComponent]
})
export class AppModule {}
