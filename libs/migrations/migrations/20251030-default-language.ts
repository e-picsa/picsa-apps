import { Injector } from '@angular/core';
import { ConfigurationService } from '@picsa/configuration/src';
import { ILocaleCode } from '@picsa/data';

import { IMigration } from '../types';

/**
 * Previously users would assign a single `global_en` locale code when using the English language option.
 * Prefer to use country-specific zm_en, mw_en etc., to support localised English versions of resources
 * (e.g. farmer manual english version differs in zm and mw)
 */
const migration: IMigration = {
  id: 20251030,
  label: 'Locale Codes',
  up: async (injector: Injector) => {
    const configurationService = injector.get(ConfigurationService);
    const { country_code, language_code } = configurationService.userSettings();
    if (country_code && language_code === 'global_en') {
      const nextLocale = `${country_code}_en` as ILocaleCode;
      configurationService.updateUserSettings({ language_code: nextLocale });
      return `migrated global_en -> ${nextLocale}`;
    }
    return 'skipped: no global_en locale';
  },
  app_version: '4.9.0',
};
export default migration;
