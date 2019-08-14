import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ModuleWithProviders } from '@angular/core';

import { AppComponent } from './app.component';
import {
  AppRoutingModule,
  BudgetToolRoutingModule
} from './app-routing.module';
import { HttpClientModule } from '@angular/common/http';
import { NgReduxRouterModule } from '@angular-redux/router';
import { MobxAngularModule } from 'mobx-angular';
// import { CanvasWhiteboardModule } from 'ng2-canvas-whiteboard';
import { PicsaDbModule, PicsaNativeModule } from '@picsa/modules';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BudgetMaterialModule } from './material.module';

const StandaloneImports = [
  BrowserModule,
  BrowserAnimationsModule,
  AppRoutingModule,
  NgReduxRouterModule.forRoot(),
  PicsaDbModule.forRoot(),
  PicsaNativeModule.forRoot(),
  HttpClientModule,
  BudgetMaterialModule,
  MobxAngularModule
  // CanvasWhiteboardModule,
];
const CommonImports = [];
const ChildImports = [BudgetToolRoutingModule];

/*******************************************************************
 *  Standalone Version
 ******************************************************************/
@NgModule({
  declarations: [AppComponent],
  imports: [...StandaloneImports, ...CommonImports],
  bootstrap: [AppComponent]
})
export class AppModule {}

/*******************************************************************
 *  Embedded Version (requires standalone imports in master app)
 * https://medium.com/disney-streaming/combining-multiple-angular-applications-into-a-single-one-e87d530d6527
 ******************************************************************/
@NgModule({
  declarations: [AppComponent],
  imports: [...CommonImports, ...ChildImports],
  bootstrap: [AppComponent]
})
class AppEmbeddedModule {}

@NgModule({})
export class BudgetToolModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: AppEmbeddedModule,
      providers: []
    };
  }
}
