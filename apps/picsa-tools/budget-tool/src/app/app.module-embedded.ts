import { ModuleWithProviders, NgModule } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { PicsaTranslateService } from '@picsa/shared/modules';
import { registerEmbeddedRoutes } from '@picsa/utils';
import { ROUTES_COMMON } from './app-routing.module';
import { AppComponentEmbedded } from './app.component';
import { APP_COMMON_IMPORTS } from './app.module';
import { BudgetStore } from './store/budget.store';

export class EmbeddedConfig {
  /** Path app routed through, e.g. 'budget' */
  urlPrefix: string;
}

/*******************************************************************
 *  Routes
 ******************************************************************/
@NgModule({
  imports: [RouterModule.forChild([])],
})
export class EmbeddedRoutingModule {
  constructor(router: Router, embeddedConfig: EmbeddedConfig) {
    registerEmbeddedRoutes(ROUTES_COMMON, router, embeddedConfig.urlPrefix);
  }
}

/*******************************************************************
 * Module
 ******************************************************************/
@NgModule({
  declarations: [AppComponentEmbedded],
  imports: [...APP_COMMON_IMPORTS, EmbeddedRoutingModule],
  bootstrap: [AppComponentEmbedded],
})
export class BaseModule {
  // ensure translate has been initiated
  constructor(
    public translate: PicsaTranslateService,
    budgetStore: BudgetStore
  ) {
    budgetStore.init();
  }
}

/** Use to import directly into another app via lazy-loading */
@NgModule()
export class BudgetToolModule {
  static forRoot(config: EmbeddedConfig): ModuleWithProviders<BaseModule> {
    return {
      ngModule: BaseModule,
      providers: [
        PicsaTranslateService,
        { provide: EmbeddedConfig, useValue: config },
      ],
    };
  }
}
