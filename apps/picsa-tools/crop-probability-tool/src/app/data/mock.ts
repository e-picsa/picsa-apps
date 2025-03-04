import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { ICountryCode } from '@picsa/data';
import {} from '@picsa/models';

import { IStationCropInformation } from '../models';
import MW_DATA from './mw';
import ZM_DATA from './zm';

export const STATION_CROP_DATA: Record<ICountryCode, IStationCropInformation[]> = {
  mw: MW_DATA,
  // HACK - global show all
  global: [...MW_DATA, ...ZM_DATA],
  tj: [],
  zm: ZM_DATA,
};
