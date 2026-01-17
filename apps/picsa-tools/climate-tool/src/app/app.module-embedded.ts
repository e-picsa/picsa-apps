import { inject,ModuleWithProviders, NgModule } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { PicsaTranslateService } from '@picsa/shared/modules';
import { registerEmbeddedRoutes } from '@picsa/utils/angular';

import { AppComponentEmbedded } from './app.component';
import { APP_COMMON_IMPORTS } from './app.module';
import { ROUTES_COMMON } from './app-routing.module';

export class EmbeddedConfig {
  /** Path app routed through, e.g. 'climate' */
  urlPrefix: string;
}

/*******************************************************************
 *  Routes
 ******************************************************************/
@NgModule({
  imports: [RouterModule.forChild([])],
})
export class EmbeddedRoutingModule {
  constructor() {
    const router = inject(Router);
    const embeddedConfig = inject(EmbeddedConfig);

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
  translate = inject(PicsaTranslateService);
}

/** Use to import directly into another app via lazy-loading */
@NgModule()
export class ClimateToolModule {
  static forRoot(config: EmbeddedConfig): ModuleWithProviders<BaseModule> {
    return {
      ngModule: BaseModule,
      providers: [PicsaTranslateService, { provide: EmbeddedConfig, useValue: config }],
    };
  }
}
