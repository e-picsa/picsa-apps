import type { CountryCodeLegacy } from '@picsa/server-types';
import { arrayToHashmap } from '@picsa/utils';

// TODO - migrate data to use modern locales
export type ICountryCode = CountryCodeLegacy;

const COUNTRIES_BASE: { [key in ICountryCode]: { label: string } } = {
  mw: { label: 'Malawi' },
  zm: { label: 'Zambia' },
  tj: { label: 'Tajikistan' },
  zw: { label: 'Zimbabwe' },
  // demo sandbox country (hidden from the picker until the frontend swap)
  xx: { label: 'Demo' },
  // order entry will also be used for language select screen, so keep global at bottom
  global: { label: 'Global' },
};

export const COUNTRIES_DATA = Object.entries(COUNTRIES_BASE)
  .map(([id, { label }]) => ({
    id: id as ICountryCode,
    label,
    flag_path: `assets/images/flags/${id}.svg`,
  }))
  // HACK - remove Tajikistan data as not currently in use, and hide the demo
  // country until the frontend `global`→demo swap lands
  .filter((c) => c.id !== 'tj' && c.id !== 'xx');
export type ICountriesDataEntry = (typeof COUNTRIES_DATA)[0];
export const COUNTRIES_DATA_HASHMAP = arrayToHashmap(COUNTRIES_DATA, 'id') as {
  [code in ICountryCode]: ICountriesDataEntry;
};
