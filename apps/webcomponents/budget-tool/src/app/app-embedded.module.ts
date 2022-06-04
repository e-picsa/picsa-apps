import { ModuleWithProviders, NgModule } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { PicsaTranslateService } from '@picsa/shared/modules';
import { ROUTES_COMMON } from './app-routing.module';
import { AppComponentEmbedded } from './app.component';
import { APP_COMMON_IMPORTS } from './app.module';

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
    this.registerEmbeddedRoutes(router, embeddedConfig.urlPrefix);
  }
  /**
   * When embedding as part of another application the route will have an initial prefix
   * Rewrite all existing routes to use the same prefix
   */
  private registerEmbeddedRoutes(router: Router, prefix: string) {
    router.resetConfig([
      ...router.config.filter((route) => !route.path?.startsWith(prefix)),
      ...ROUTES_COMMON.map((route) => {
        route.path = route.path ? `${prefix}/${route.path}` : prefix;
        return route;
      }),
    ]);
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
  constructor(public translate: PicsaTranslateService) {}
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
