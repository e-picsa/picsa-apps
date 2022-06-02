import { BrowserModule } from '@angular/platform-browser';
import { NgModule, ModuleWithProviders } from '@angular/core';
import { AppComponent, AppComponentEmbedded } from './app.component';
import {
  AppRoutingModule,
  BudgetToolRoutingModule,
} from './app-routing.module';
import { HttpClientModule } from '@angular/common/http';
import { NgReduxRouterModule } from '@angular-redux/router';
import { MobxAngularModule } from 'mobx-angular';
// import { CanvasWhiteboardModule } from 'ng2-canvas-whiteboard';
import {
  PicsaDbModule,
  PicsaNativeModule,
  PicsaTranslateModule,
  PicsaTranslateService,
} from '@picsa/shared/modules';
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
  MobxAngularModule,
  PicsaTranslateModule.forRoot(),
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
  bootstrap: [AppComponent],
})
export class AppModule {
  constructor(private translate: PicsaTranslateService) {}
}

/*******************************************************************
 *  Embedded Version (requires standalone imports in master app)
 * https://medium.com/disney-streaming/combining-multiple-angular-applications-into-a-single-one-e87d530d6527
 ******************************************************************/
@NgModule({
  declarations: [AppComponentEmbedded],
  imports: [...CommonImports, ...ChildImports],
  bootstrap: [AppComponentEmbedded],
})
export class AppEmbeddedModule {
  // ensure translate has been initiated
  constructor(public translate: PicsaTranslateService) {}
}

@NgModule({})
export class BudgetToolModule {
  static forRoot(): ModuleWithProviders<AppEmbeddedModule> {
    return {
      ngModule: AppEmbeddedModule,
      providers: [PicsaTranslateService],
    };
  }
}
