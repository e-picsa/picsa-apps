import { ModuleWithProviders, NgModule } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { PicsaTranslateService } from '@picsa/shared/modules';
import { registerEmbeddedRoutes } from '@picsa/utils/angular';

import { AppComponentEmbedded } from './app.component';
import { APP_COMMON_IMPORTS } from './app.module';
import { ROUTES_COMMON } from './app-routing.module';
import { FarmerActivityService } from './services/farmer-activity.service';

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
  constructor(router: Router, embeddedConfig: EmbeddedConfig, service: FarmerActivityService) {
    registerEmbeddedRoutes(ROUTES_COMMON, router, embeddedConfig.urlPrefix);
    service.createNestedToolRoutes(router);
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
export class FarmerActivityModule {
  static forRoot(config: EmbeddedConfig): ModuleWithProviders<BaseModule> {
    return {
      ngModule: BaseModule,
      providers: [PicsaTranslateService, { provide: EmbeddedConfig, useValue: config }],
    };
  }
}
