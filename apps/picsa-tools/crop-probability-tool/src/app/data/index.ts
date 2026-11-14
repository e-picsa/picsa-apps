import { ICountryCode } from '@picsa/data';
import {} from '@picsa/models';

import { IProbabilityTable } from '../models';
import MW_DATA from './mw';
import ZM_DATA from './zm';
import ZW_DATA from './zw';

export const PROBABILITY_TABLE_DATA: Record<ICountryCode, IProbabilityTable[]> = {
  mw: MW_DATA,
  // HACK - global show all
  global: [...MW_DATA, ...ZM_DATA, ...ZW_DATA],
  tj: [],
  // Demo content served from the dashboard backend; no bundled tables yet
  xx: [],
  zm: ZM_DATA,
  zw: ZW_DATA,
};
