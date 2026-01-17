import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PicsaCommonComponentsModule } from '@picsa/components/src';
import { PicsaDbModule, PicsaNativeModule, PicsaTranslateModule, PicsaTranslateService } from '@picsa/shared/modules';
import { MobxAngularModule } from 'mobx-angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { BudgetMaterialModule } from './material.module';
import { BudgetStore } from './store/budget.store';

/** Core imports only required when running standalone */
const StandaloneImports = [BrowserModule, BrowserAnimationsModule, AppRoutingModule];

/** Common imports used in both standalone and embedded formats */
export const APP_COMMON_IMPORTS = [
  BudgetMaterialModule,
  MobxAngularModule,
  PicsaDbModule.forRoot(),
  PicsaNativeModule.forRoot(),
  PicsaTranslateModule.forRoot(),
  PicsaCommonComponentsModule,
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
    budgetStore: BudgetStore,
  ) {
    budgetStore.init();
  }
}
