import type { CountryCode, CountryCodeLegacy } from './db-derived.types';

/** Map legacy country codes to newer standard */
export const COUNTRY_CODE_LEGACY_MAPPING: Record<CountryCodeLegacy, CountryCode> = {
  global: 'XX',
  mw: 'MW',
  tj: 'TJ',
  zm: 'ZM',
  zw: 'ZW',
};
