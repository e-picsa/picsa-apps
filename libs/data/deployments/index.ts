import { arrayToHashmap } from '@picsa/utils/data';
import { IStationMetaDB } from '@picsa/models/src';

/*******************************************************************
 * Country Settings
 ********************************************************************/
const COUNTRIES_BASE = {
  global: { label: 'Global' },
  mw: { label: 'Malawi' },
  zm: { label: 'Zambia' },
  tj: { label: 'Tajikistan' },
} as const;

export type ICountryCode = keyof typeof COUNTRIES_BASE;
export const COUNTRIES_DATA = Object.entries(COUNTRIES_BASE).map(([id, { label }]) => ({
  id: id as ICountryCode,
  label: label as string,
  flag_path: `assets/images/flags/${id}.svg`,
}));
export type ICountriesDataEntry = typeof COUNTRIES_DATA[0];
export const COUNTRIES_DATA_HASHMAP = arrayToHashmap(COUNTRIES_DATA, 'id') as {
  [code in ICountryCode]: ICountriesDataEntry;
};

/*******************************************************************
 * Language Settings
 ********************************************************************/
interface ILanguageMeta {
  language_code: string;
  language_label: string;
  country_code: ICountryCode;
  country_label: string;
  flag_path?: string;
}
const LANGUAGES_BASE = {
  global_en: { language_code: 'en', language_label: 'English', country_code: 'global' },
  mw_ny: { language_code: 'ny', language_label: 'Chichewa', country_code: 'mw' },
  zm_ny: { language_code: 'ny', language_label: 'Chichewa', country_code: 'zm' },
  tj_tg: { language_code: 'tg', language_label: 'Тоҷикӣ', country_code: 'tj' },
} as const;

export type ILanguageCode = keyof typeof LANGUAGES_BASE;
export const LANGUAGES_DATA = Object.entries(LANGUAGES_BASE).map(([id, data]) => ({
  id: id as ILanguageCode,
  flag_path: `assets/images/flags/${data.country_code}.svg`,
  ...(data as ILanguageMeta),
}));

export type ILanguageDataEntry = typeof LANGUAGES_DATA[0];
export const LANGUAGES_DATA_HASHMAP = arrayToHashmap(LANGUAGES_DATA, 'id') as {
  [code in ILanguageCode]: ILanguageDataEntry;
};

/*******************************************************************
 * Deployment Settings
 ********************************************************************/

export interface IDeploymentSettings {
  /** Country to associate deployment with */
  country_code: ICountryCode;
  /** Budget tool custom settings */
  budgetTool: {
    /** Label assigned to currency value */
    currency: string;
    /** Unit represented by a single dot, should be power of 10 closest to $1 equivalent (e.g. MK 1000, ZMK 10, GBP 1) */
    currencyBaseValue: number;
  };
  climateTool: {
    /** Filter function for stations. Default filter by country_code (defined in site-select.page.ts) */
    station_filter?: (station: IStationMetaDB) => boolean;
  };
  theme: string;
}

const DEPLOYMENT_DEFAULTS: IDeploymentSettings = {
  country_code: null as any,
  budgetTool: { currency: '$', currencyBaseValue: 1 },
  climateTool: {},
  theme: 'picsa-default',
};

// Utility to generate settings with defaults
function generate(settings: Partial<IDeploymentSettings>) {
  const combined: IDeploymentSettings = { ...DEPLOYMENT_DEFAULTS, ...settings };
  return combined;
}

const DEPLOYMENTS_BASE = {
  global: generate({ climateTool: { station_filter: () => true } }),
  mw: generate({
    country_code: 'mw',
    budgetTool: {
      currency: 'MK',
      currencyBaseValue: 10000,
    },
    theme: 'picsa-mw',
  }),
  zm: generate({
    country_code: 'zm',
    budgetTool: {
      currency: 'ZMK',
      currencyBaseValue: 10,
    },
    theme: 'picsa-zm',
  }),
  tj: generate({
    country_code: 'tj',
    budgetTool: {
      currency: 'TJS',
      currencyBaseValue: 10,
    },
    theme: 'picsa-tj',
  }),
} as const;

// Extract list of available weather names
export type IDeploymentId = keyof typeof DEPLOYMENTS_BASE;

export const DEPLOYMENT_DATA = Object.entries(DEPLOYMENTS_BASE).map(([id, data]) => {
  return {
    id: id as IDeploymentId,
    ...data,
  };
});

export type IDeploymentSettingsDataEntry = typeof DEPLOYMENT_DATA[0];

export const DEPLOYMENT_DATA_HASHMAP = arrayToHashmap(DEPLOYMENT_DATA, 'id') as {
  [code in IDeploymentId]: IDeploymentSettingsDataEntry;
};
