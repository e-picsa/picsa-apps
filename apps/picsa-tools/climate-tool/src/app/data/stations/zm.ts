import { CLIMATE_CHART_DEFINTIONS } from '@picsa/data/climate/chart_definitions';
import type { IStationMeta } from '@picsa/models';
import merge from 'deepmerge';

const stations: IStationMeta[] = [
  {
    id: 'chipata',
    name: 'Chipata',
    latitude: -13.3843,
    longitude: 32.3847,
    countryCode: 'zm',
    definitions: CLIMATE_CHART_DEFINTIONS.zm,
  },
  {
    id: 'petauke',
    name: 'Petauke',
    latitude: -14.24474,
    longitude: 31.327641,
    countryCode: 'zm',
    definitions: merge(CLIMATE_CHART_DEFINTIONS.zm, {
      extreme_rainfall_days: { definition: 'For Petauke the 95th percentile calculated to be 41.35mm' },
    }),
  },
];

export default stations;
