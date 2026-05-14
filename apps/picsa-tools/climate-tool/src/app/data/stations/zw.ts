import { CLIMATE_CHART_DEFINITIONS } from '@picsa/data/climate/chart_definitions';
import type { IStationMeta } from '@picsa/models';

const stations: IStationMeta[] = [
  {
    id: 'buffalo_range',
    name: 'Buffalo Range',
    latitude: -21.017,
    longitude: 31.583,
    location: ['Masvingo'],
  },
  {
    id: 'chisumbanje',
    name: 'Chisumbanje',
    latitude: -20.825,
    longitude: 32.204,
    location: ['Manicaland'],
  },
  {
    id: 'masvingo',
    name: 'Masvingo',
    latitude: -20.067,
    longitude: 30.867,
    location: ['Masvingo'],
  },
  {
    id: 'mt_darwin',
    name: 'Mt Darwin',
    latitude: -16.783,
    longitude: 31.583,
    location: ['Mashonaland Central'],
  },
  {
    id: 'plumtree',
    name: 'Plumtree',
    latitude: -20.483,
    longitude: 27.8,
    location: ['Matabeleland South'],
  },
].map((station) => ({
  ...station,
  countryCode: 'zw',
  definitions: CLIMATE_CHART_DEFINITIONS.zw,
}));

export default stations;
