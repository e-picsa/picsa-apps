import { inject, Injectable } from '@angular/core';
import type { MissingTranslationHandler, MissingTranslationHandlerParams, Translation } from '@ngx-translate/core';

import { PicsaTranslateDebugService } from './translate-debug.service';

/**
 * Falls back to the key (the English source text) for missing translations.
 * When translation debug is enabled the key is wrapped in bullet markers instead.
 */
@Injectable()
export class PicsaMissingTranslationHandler implements MissingTranslationHandler {
  private debugService = inject(PicsaTranslateDebugService);

  public handle({ key, interpolateParams, translateService }: MissingTranslationHandlerParams): Translation {
    if (!this.debugService.enabled()) {
      return key;
    }
    const marked = `•${key}•`;
    return translateService.parser.interpolate(marked, interpolateParams) ?? marked;
  }
}
