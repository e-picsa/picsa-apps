import type { IStationMeta } from '@picsa/models';
import { CountryCodeLegacy } from '@picsa/server-types';

import MW_STATIONS from './mw';
// import TJ_STATIONS from './tj';
import ZM_STATIONS from './zm';
import ZW_STATIONS from './zw';

export const CLIMATE_STATIONS_META: Record<CountryCodeLegacy, IStationMeta[]> = {
  global: [],
  mw: MW_STATIONS,
  tj: [],
  zm: ZM_STATIONS,
  zw: ZW_STATIONS,
};
