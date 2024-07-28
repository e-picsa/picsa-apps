/*******************************************************************
 * Country Settings
 ********************************************************************/

import { Database } from '@picsa/server-types';
import { arrayToHashmap } from '@picsa/utils';

// NOTE - country_codes restricted by database enum
export type ICountryCode = Database['public']['Enums']['country_code'];

const COUNTRIES_BASE: { [key in ICountryCode]: { label: string } } = {
  global: { label: 'Global' },
  mw: { label: 'Malawi' },
  zm: { label: 'Zambia' },
  tj: { label: 'Tajikistan' },
};

export const COUNTRIES_DATA = Object.entries(COUNTRIES_BASE).map(([id, { label }]) => ({
  id: id as ICountryCode,
  label,
  flag_path: `assets/images/flags/${id}.svg`,
}));
export type ICountriesDataEntry = typeof COUNTRIES_DATA[0];
export const COUNTRIES_DATA_HASHMAP = arrayToHashmap(COUNTRIES_DATA, 'id') as {
  [code in ICountryCode]: ICountriesDataEntry;
};
