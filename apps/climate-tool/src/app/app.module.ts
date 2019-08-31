import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ModuleWithProviders } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppComponent, AppComponentEmbedded } from './app.component';
import {
  AppRoutingModule,
  ClimateToolRoutingModule
} from './app-routing.module';
import { PicsaTranslateModule } from '@picsa/modules/translate';
import { PicsaDbModule } from '@picsa/modules/db.module';
import { MatSliderModule } from '@angular/material/slider';
// required for material slider
import 'hammerjs';

const StandaloneImports = [
  BrowserModule,
  BrowserAnimationsModule,
  MatSliderModule,
  PicsaTranslateModule.forRoot(),
  PicsaDbModule.forRoot(),
  AppRoutingModule
];
const ChildImports = [ClimateToolRoutingModule];

/*******************************************************************
 *  Standalone Version
 ******************************************************************/
@NgModule({
  declarations: [AppComponent],
  imports: StandaloneImports,
  bootstrap: [AppComponent]
})
export class AppModule {}

/*******************************************************************
 *  Embedded Version (requires standalone imports in master app)
 *  Note, could also be duplicated here and shouldn't throw error
 ******************************************************************/
@NgModule({
  declarations: [AppComponentEmbedded],
  imports: ChildImports,
  bootstrap: [AppComponentEmbedded]
})
export class AppEmbeddedModule {}

@NgModule({})
export class ClimateToolModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: AppEmbeddedModule,
      providers: []
    };
  }
}
