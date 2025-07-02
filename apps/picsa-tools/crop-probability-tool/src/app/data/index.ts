import { ICountryCode } from '@picsa/data';
import {} from '@picsa/models';

import { IProbabilityTable } from '../models';
import MW_DATA from './mw';
import ZM_DATA from './zm';

export const PROBABILITY_TABLE_DATA: Record<ICountryCode, IProbabilityTable[]> = {
  mw: MW_DATA,
  // HACK - global show all
  global: [...MW_DATA, ...ZM_DATA],
  tj: [],
  zm: ZM_DATA,
};
