import { CLIMATE_CHART_DEFINTIONS } from '@picsa/data/climate/chart_definitions';
import type { IStationMeta } from '@picsa/models';

const stations: IStationMeta[] = [
  {
    id: 'dushanbe',
    name: 'Dushanbe',
    latitude: 38.557671,
    longitude: 68.775917,
    countryCode: 'tj',
    definitions: CLIMATE_CHART_DEFINTIONS.zm,
  },
];

export default stations;
