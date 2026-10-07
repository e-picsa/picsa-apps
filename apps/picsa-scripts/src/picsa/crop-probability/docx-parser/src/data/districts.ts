import { arrayToHashmap } from '@picsa/utils';
import MW_DISTRICTS from '@picsa/data/geoLocation/mw/districts';
import type { ICountryCode } from '@picsa/data';

const ZW_DISTRICTS = [
  { id: 'masvingo', label: 'Masvingo' },
  { id: 'mangwe', label: 'Mangwe' },
  { id: 'mwenesi', label: 'Mwenezi' },
  { id: 'chipinge', label: 'Chipinge' },
  { id: 'rushinga', label: 'Rushinga' },
];

export const DISTRICTS: Partial<Record<ICountryCode, { [id: string]: { id: string; label: string } }>> = {
  mw: arrayToHashmap(MW_DISTRICTS, 'label'),
  zw: arrayToHashmap(ZW_DISTRICTS, 'label'),
};
