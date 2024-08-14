import type { IStationMeta } from '@picsa/models';

import MW_STATIONS from './mw';
import TJ_STATIONS from './tj';
import ZM_STATIONS from './zm';

export const HARDCODED_STATIONS = ([] as IStationMeta[]).concat(MW_STATIONS, TJ_STATIONS, ZM_STATIONS);
