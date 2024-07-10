import { arrayToHashmap } from '@picsa/utils';
import { ICountryCode } from './countries';
import { Database } from '@picsa/server-types';

/*******************************************************************
 * Language Settings
 ********************************************************************/

// NOTE - country_codes restricted by database enum
export type ILocaleCode = Database['public']['Enums']['locale_code'];

// NOTE - 'language' commonly used where 'locale' would be more accurate
export interface ILocaleDataEntry {
  id: string;
  language_code: string;
  language_label: string;
  country_code: ICountryCode;
  flag_path: string;
}
const LOCALES_BASE: {
  [code in ILocaleCode]: { language_code: string; language_label: string; country_code: ICountryCode };
} = {
  global_en: { language_code: 'en', language_label: 'English', country_code: 'global' },
  mw_ny: { language_code: 'ny', language_label: 'Chichewa', country_code: 'mw' },
  mw_tum: { language_code: 'tum', language_label: 'Tumbuka', country_code: 'mw' },
  zm_ny: { language_code: 'ny', language_label: 'Chichewa', country_code: 'zm' },
  tj_tg: { language_code: 'tg', language_label: 'Тоҷикӣ', country_code: 'tj' },
} as const;

export const LOCALES_DATA: ILocaleDataEntry[] = Object.entries(LOCALES_BASE).map(([id, data]) => ({
  id: id as ILocaleCode,
  flag_path: `assets/images/flags/${data.country_code}.svg`,
  ...data,
}));

export const LOCALES_DATA_HASHMAP = arrayToHashmap(LOCALES_DATA, 'id') as {
  [code in ILocaleCode]: ILocaleDataEntry;
};
