import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { MissingTranslationHandlerParams } from '@ngx-translate/core';

import { PicsaMissingTranslationHandler } from './missing-translation.handler';
import { PicsaTranslateDebugService, TRANSLATION_DEBUG_STORAGE_KEY } from './translate-debug.service';

describe('translation debug', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  describe('PicsaTranslateDebugService', () => {
    const createService = (search = '') => {
      window.history.replaceState({}, '', `/${search}`);
      return new PicsaTranslateDebugService();
    };

    it('enables via query param and persists the setting', () => {
      const service = createService('?translationDebug=1');
      expect(service.enabled()).toBe(true);
      expect(localStorage.getItem(TRANSLATION_DEBUG_STORAGE_KEY)).toBe('true');
    });

    it('treats a bare query param as enabled', () => {
      const service = createService('?translationDebug');
      expect(service.enabled()).toBe(true);
    });

    it('disables via query param even when previously enabled', () => {
      localStorage.setItem(TRANSLATION_DEBUG_STORAGE_KEY, 'true');
      const service = createService('?translationDebug=0');
      expect(service.enabled()).toBe(false);
      expect(localStorage.getItem(TRANSLATION_DEBUG_STORAGE_KEY)).toBe('false');
    });

    it('restores the persisted setting without a query param', () => {
      localStorage.setItem(TRANSLATION_DEBUG_STORAGE_KEY, 'true');
      const service = createService();
      expect(service.enabled()).toBe(true);
    });

    it('persists changes made via setEnabled', () => {
      const service = createService();
      service.setEnabled(true);
      expect(service.enabled()).toBe(true);
      expect(localStorage.getItem(TRANSLATION_DEBUG_STORAGE_KEY)).toBe('true');
    });
  });

  describe('PicsaMissingTranslationHandler', () => {
    const createHandler = (enabled: boolean) => {
      TestBed.configureTestingModule({
        providers: [
          PicsaMissingTranslationHandler,
          { provide: PicsaTranslateDebugService, useValue: { enabled: signal(enabled) } },
        ],
      });
      return TestBed.inject(PicsaMissingTranslationHandler);
    };

    const createParams = (key: string, interpolateParams?: object) =>
      ({
        key,
        interpolateParams,
        translateService: { parser: { interpolate: (text: string) => text } },
      }) as unknown as MissingTranslationHandlerParams;

    it('falls back to the untranslated key by default', () => {
      const handler = createHandler(false);
      expect(handler.handle(createParams('Download All'))).toBe('Download All');
    });

    it('marks missing translations when debug is enabled', () => {
      const handler = createHandler(true);
      expect(handler.handle(createParams('Download All'))).toBe('•Download All•');
    });

    it('interpolates parameters in the marked output', () => {
      const handler = createHandler(true);
      const params = createParams('Hello {{name}}', { name: 'Sam' });
      (params.translateService as unknown as { parser: { interpolate: jest.Mock } }).parser.interpolate = jest.fn(
        (text: string) => text.replace('{{name}}', 'Sam'),
      );
      expect(handler.handle(params)).toBe('•Hello Sam•');
    });
  });
});
