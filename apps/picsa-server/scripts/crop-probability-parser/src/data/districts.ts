import { arrayToHashmap } from '../../../../../../libs/utils';
import MW_DISTRICTS from '../../../../../../libs/data/geoLocation/mw/districts';

export const DISTRICTS = {
  mw: arrayToHashmap(MW_DISTRICTS, 'label'),
};
