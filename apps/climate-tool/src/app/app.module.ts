import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { PicsaTranslateModule } from '@picsa/modules/translate';
import { PicsaDbModule } from '@picsa/modules';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    PicsaTranslateModule.forRoot(),
    PicsaDbModule.forRoot()
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
