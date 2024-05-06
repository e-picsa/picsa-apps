import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { IPicsaDataWithIcons } from '../models';
import { arrayToHashmap } from '@picsa/utils/data';

/*******************************************************************
 * Language Settings
 ********************************************************************/
const LANGUAGES_BASE = {
  en: { label: 'English' },
  mw_ny: { label: 'Chichewa' },
  zm_ny: { label: 'Chichewa' },
  tj_tg: { label: 'Тоҷикӣ' },
} as const;

export type ILanguageCode = keyof typeof LANGUAGES_BASE;
const LANGUAGES_DATA = Object.entries(LANGUAGES_BASE).map(([id, { label }]) => ({
  id: id as ILanguageCode,
  label: label as string,
}));

export type ILanguageDataEntry = typeof LANGUAGES_DATA[0];
export const LANGUAGES_DATA_HASHMAP = arrayToHashmap(LANGUAGES_DATA, 'id') as {
  [code in ILanguageCode]: ILanguageDataEntry;
};

/*******************************************************************
 * Deployment Settings
 ********************************************************************/

export interface IDeploymentSettings {
  label: string;
  /** Path to deployment icon asset */
  assetIconPath: string;
  /** Country to associate deployment with */
  country_code: string;
  /** List of available language codes */
  language_codes: ILanguageCode[];
  /** Budget tool custom settings */
  budgetTool: {
    /** Label assigned to currency value */
    currency: string;
    /** Unit represented by a single dot, should be power of 10 closest to $1 equivalent (e.g. MK 1000, ZMK 10, GBP 1) */
    currencyBaseValue: number;
  };
  climateTool: { station_filter?: (station: any) => boolean };
  theme: string;
}

const DEPLOYMENT_DEFAULTS: IDeploymentSettings = {
  label: '',
  assetIconPath: '',
  country_code: '',
  language_codes: Object.keys(LANGUAGES_BASE) as ILanguageCode[],
  budgetTool: { currency: '$', currencyBaseValue: 1 },
  climateTool: { station_filter: (station: any) => true },
  theme: 'picsa-default',
};

// Utility to combine settings with defaults
function combine(settings: Partial<IDeploymentSettings>) {
  return { ...DEPLOYMENT_DEFAULTS, ...settings };
}

const DEPLOYMENTS_BASE = {
  global: combine({ label: 'Global' }),
  mw: combine({
    label: 'Malawi',
    language_codes: ['mw_ny', 'en'],
    budgetTool: {
      currency: 'MK',
      currencyBaseValue: 10000,
    },
    theme: 'picsa-mw',
  }),
  zm: combine({
    label: 'Zambia',
    language_codes: ['zm_ny', 'en'],
    budgetTool: {
      currency: 'ZMK',
      currencyBaseValue: 10,
    },
    theme: 'picsa-zm',
  }),
  tj: combine({
    label: 'Tajikistan',
    language_codes: ['tj_tg', 'en'],
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
    assetIconPath: data.assetIconPath || `assets/images/flags/${id}.svg`,
    country_code: data.country_code || id,
  };
});

export type IDeploymentSettingsDataEntry = typeof DEPLOYMENT_DATA[0];

export const DEPLOYMENT_DATA_HASHMAP = arrayToHashmap(DEPLOYMENT_DATA, 'id') as {
  [code in IDeploymentId]: IDeploymentSettingsDataEntry;
};
