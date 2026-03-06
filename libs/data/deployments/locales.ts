import { arrayToHashmap } from '@picsa/utils';
import type { ICountryCode } from './countries';
import type { LocaleCodeLegacy } from '@picsa/server-types';

/*******************************************************************
 * Language Settings
 ********************************************************************/

// NOTE - country_codes restricted by database enum
export type ILocaleCode = LocaleCodeLegacy;

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
  // Default (non-localised)
  global_en: { language_code: 'en', language_label: 'English', country_code: 'global' },
  // Malawi
  mw_en: { language_code: 'en', language_label: 'English', country_code: 'mw' },
  mw_ny: { language_code: 'ny', language_label: 'Chichewa', country_code: 'mw' },
  mw_tum: { language_code: 'tum', language_label: 'Tumbuka', country_code: 'mw' },
  // Zambia
  zm_en: { language_code: 'en', language_label: 'English', country_code: 'zm' },
  zm_ny: { language_code: 'ny', language_label: 'Nyanja', country_code: 'zm' },
  zm_bem: { language_code: 'bem', language_label: 'Bemba', country_code: 'zm' },
  zm_toi: { language_code: 'toi', language_label: 'Tonga', country_code: 'zm' },
  zm_loz: { language_code: 'loz', language_label: 'Lozi', country_code: 'zm' },
  zm_lun: { language_code: 'lun', language_label: 'Lunda', country_code: 'zm' },
  zm_kqn: { language_code: 'kqn', language_label: 'Kaonde', country_code: 'zm' },
  zm_lue: { language_code: 'lue', language_label: 'Luvale', country_code: 'zm' },
  // Zimbabwe
  zw_en: { language_code: 'en', language_label: 'English', country_code: 'zw' },
  zw_sn: { language_code: 'sn', language_label: 'Shona', country_code: 'zw' },
  zw_nd: { language_code: 'nd', language_label: 'Ndebele', country_code: 'zw' },
  // Tajikistan
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
