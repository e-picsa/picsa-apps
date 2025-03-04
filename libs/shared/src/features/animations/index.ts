import { CommonModule } from '@angular/common';
import { ModuleWithProviders, NgModule } from '@angular/core';
import { LottieComponent, provideCacheableAnimationLoader, provideLottieOptions } from 'ngx-lottie';

import { PicsaAnimationComponent } from './animation.component';

@NgModule({
  declarations: [PicsaAnimationComponent],
  imports: [CommonModule, LottieComponent],
  exports: [PicsaAnimationComponent],
})
/**
 * The animations module should be imported into main app module and called forRoot
 * to register services
 * It can also be imported into lazy loaded pages without additional configuration
 */
export class PicsaAnimationsModule {
  static forRoot(): ModuleWithProviders<PicsaAnimationsModule> {
    return {
      ngModule: PicsaAnimationsModule,
      providers: [
        provideLottieOptions({
          player: () =>
            import(
              /* webpackChunkName: 'lottie-web/build/player/lottie_light' */ 'lottie-web/build/player/lottie_light'
            ),
        }),
        provideCacheableAnimationLoader(),
      ],
    };
  }
}
