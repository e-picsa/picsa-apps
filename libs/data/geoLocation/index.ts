import type { ICountryCode } from '../deployments';
import { MW_GEOLOCATION_DATA } from './mw';
import type { IGeolocationData } from './types';
import { ZM_GEOLOCATION_DATA } from './zm';
import { ZW_GEOLOCATION_DATA } from './zw';

const GEO_LOCATION_DATA: Partial<Record<ICountryCode, IGeolocationData>> = {
  mw: MW_GEOLOCATION_DATA,
  zm: ZM_GEOLOCATION_DATA,
  zw: ZW_GEOLOCATION_DATA,
};

const GEO_LOCATION_PLACEHOLDER: IGeolocationData = {
  topoJson: async () => ({
    type: 'Topology',
    objects: { input: { type: 'GeometryCollection', geometries: [] } },
    arcs: [],
    transform: { scale: [], translate: [] },
    bbox: [-180, -90, 180, 90],
  }),
  layers: [{ key: 'location', label: 'Location data not available', locations: [] }],
  toolLayers: {
    cropProbability: 'location',
    forecast: 'location',
    climate: 'location',
  },
};

export function getGeoLocationData(country_code: ICountryCode): IGeolocationData {
  const data = GEO_LOCATION_DATA[country_code];
  if (data) {
    return data;
  }
  console.warn(`No geolocation data stored for ${country_code}. Using placeholder data`);
  return GEO_LOCATION_PLACEHOLDER;
}

export * from './types';
export * from './utils';
