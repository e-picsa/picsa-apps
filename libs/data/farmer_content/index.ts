import { arrayToHashmap } from '@picsa/utils';

/*******************************************************************
 * Farmer Steps
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
