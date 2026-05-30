import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { provideCacheableAnimationLoader, provideLottieOptions } from 'ngx-lottie';

/**
 * Provides the necessary global configuration for the shared animation components.
 * Consuming applications MUST call this in their app.config.ts if they use PicsaAnimationComponent.
 */
export function provideSharedAnimations(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideLottieOptions({
      player: () => import(/* webpackChunkName: 'lottie-web-light' */ 'lottie-web/build/player/lottie_light'),
    }),
    provideCacheableAnimationLoader(),
  ]);
}
