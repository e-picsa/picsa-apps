import { inject, ModuleWithProviders, NgModule } from '@angular/core';

import { DeepLinksService, DeepLinksServiceConfig } from './deep-links.service';

@NgModule({})
export class PicsaDeepLinksModule {
  constructor() {
    const deepLinksService = inject(DeepLinksService);

    deepLinksService.init();
  }
  // https://angular.io/guide/singleton-services#providing-a-singleton-service
  static forRoot(config: DeepLinksServiceConfig): ModuleWithProviders<PicsaDeepLinksModule> {
    return {
      ngModule: PicsaDeepLinksModule,
      providers: [{ provide: DeepLinksServiceConfig, useValue: config }],
    };
  }
}
