import { ModuleWithProviders, NgModule } from '@angular/core';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { AppOpenPromptComponent } from './app-open-prompt.component';
import { DeepLinksService, DeepLinksServiceConfig } from './deep-links.service';

@NgModule({
  imports: [MatIconModule, MatBottomSheetModule, MatButtonModule],
  exports: [],
  declarations: [AppOpenPromptComponent],
})
export class PicsaDeepLinksModule {
  constructor(deepLinksService: DeepLinksService) {
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
