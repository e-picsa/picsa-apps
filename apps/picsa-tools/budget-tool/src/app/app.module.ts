import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { HttpClientModule } from '@angular/common/http';
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
import { BudgetStore } from './store/budget.store';

/** Core imports only required when running standalone */
const StandaloneImports = [
  BrowserModule,
  BrowserAnimationsModule,
  AppRoutingModule,
];

/** Common imports used in both standalone and embedded formats */
export const APP_COMMON_IMPORTS = [
  BudgetMaterialModule,
  MobxAngularModule,
  PicsaDbModule.forRoot(),
  PicsaNativeModule.forRoot(),
  HttpClientModule,
  PicsaTranslateModule.forRoot(),
];

/*******************************************************************
 *  Standalone Version
 ******************************************************************/
@NgModule({
  declarations: [AppComponent],
  imports: [...StandaloneImports, ...APP_COMMON_IMPORTS],
  bootstrap: [AppComponent],
})
export class AppModule {
  // ensure translate service initialised
  constructor(
    public translate: PicsaTranslateService,
    budgetStore: BudgetStore
  ) {
    budgetStore.init();
  }
}
