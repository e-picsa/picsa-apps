import { Injector } from '@angular/core';
import { IMigration } from '../types';
import { ConfigurationService } from '@picsa/configuration/src';
import { ILocaleCode } from '@picsa/data';

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
      configurationService.updateUserSettings({ language_code: `${country_code}_en` as ILocaleCode });
    }
  },
  app_version: '4.9.0',
};
export default migration;
