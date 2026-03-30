import { inject, ModuleWithProviders, NgModule } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { PicsaTranslateService } from '@picsa/i18n';
import { registerEmbeddedRoutes } from '@picsa/utils/angular';

import { ROUTES_COMMON } from './app-routing.module';

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
  imports: [EmbeddedRoutingModule],
})
export class BaseModule {
  translate = inject(PicsaTranslateService);
}

/** Use to import directly into another app via lazy-loading */
@NgModule()
export class SeasonalCalendarToolModule {
  static forRoot(config: EmbeddedConfig): ModuleWithProviders<BaseModule> {
    return {
      ngModule: BaseModule,
      providers: [PicsaTranslateService, { provide: EmbeddedConfig, useValue: config }],
    };
  }
}
