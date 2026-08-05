import { arrayToHashmap } from '@picsa/utils';
import MW_DISTRICTS from '@picsa/data/geoLocation/mw/districts';
import type { ICountryCode } from '@picsa/data';

export const DISTRICTS: Partial<Record<ICountryCode, { [id: string]: { id: string; label: string } }>> = {
  mw: arrayToHashmap(MW_DISTRICTS, 'label'),
};
