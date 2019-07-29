import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { PicsaTranslateModule } from '@picsa/modules/translate';
import { PicsaDbModule } from '@picsa/modules';
import { MatSliderModule } from '@angular/material/slider';
// required for material slider
import 'hammerjs';

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    // required if using mat-slider lazy loaded
    BrowserAnimationsModule,
    MatSliderModule,
    AppRoutingModule,
    PicsaTranslateModule.forRoot(),
    PicsaDbModule.forRoot()
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
