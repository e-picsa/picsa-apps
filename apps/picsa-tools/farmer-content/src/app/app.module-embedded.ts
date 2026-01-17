import { inject,ModuleWithProviders, NgModule } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { PicsaTranslateService } from '@picsa/shared/modules';
import { registerEmbeddedRoutes } from '@picsa/utils/angular';

import { PicsaFarmerContent } from './app.component';
import { appRoutes } from './app.routes';
import { FarmerToolPlaceholderComponent } from './pages/tool/farmer-tool.component';
import { FarmerContentService } from './services/farmer-content.service';

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
    const service = inject(FarmerContentService);

    registerEmbeddedRoutes(appRoutes, router, embeddedConfig.urlPrefix);
    service.createNestedToolRoutes(router);
  }
}

/*******************************************************************
 * Module
 ******************************************************************/
@NgModule({
  declarations: [PicsaFarmerContent, FarmerToolPlaceholderComponent],
  imports: [EmbeddedRoutingModule, RouterModule, RouterOutlet],
  bootstrap: [PicsaFarmerContent],
})
export class BaseModule {
  translate = inject(PicsaTranslateService);
}

/** Use to import directly into another app via lazy-loading */
@NgModule()
export class FarmerContentModule {
  static forRoot(config: EmbeddedConfig): ModuleWithProviders<BaseModule> {
    return {
      ngModule: BaseModule,
      providers: [PicsaTranslateService, { provide: EmbeddedConfig, useValue: config }],
    };
  }
}
