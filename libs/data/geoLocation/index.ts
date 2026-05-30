import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import MW_DISTRICTS from './mw/districts';
import { ICountryCode } from '../deployments';
import { IGeolocationData } from './types';
import ZM_PROVINCES from './zm/provinces';
import ZM_DISTRICTS from './zm/districts';
import ZW_PROVINCES from './zw/provinces';

export * from './utils';
export * from './types';

const GEO_LOCATION_DATA: { [country_code in ICountryCode]?: IGeolocationData } = {
  mw: {
    topoJson: async () => {
      const res = await import('./mw/MW.topo.json');
      return res.default;
    },
    admin_4: {
      label: translateMarker('District'),
      locations: MW_DISTRICTS,
    },
  },
  zm: {
    topoJson: async () => {
      const res = await import('./zm/ZM.topo.json');
      return res.default;
    },
    admin_4: {
      label: translateMarker('Province'),
      locations: ZM_PROVINCES,
    },
    admin_5: {
      label: translateMarker('District'),
      locations: ZM_DISTRICTS,
    },
  },
  zw: {
    topoJson: async () => {
      const res = await import('./zw/ZW.topo.json');
      return res.default;
    },
    admin_4: {
      label: translateMarker('Province'),
      locations: ZW_PROVINCES,
    },
  },
};

const GEO_LOCATION_PLACEHOLDER: IGeolocationData = {
  topoJson: async () => ({
    type: 'Topology',
    objects: { input: { type: 'GeometryCollection', geometries: [] } },
    arcs: [],
    transform: { scale: [], translate: [] },
    bbox: [-180, -90, 180, 90],
  }),
  admin_4: { label: 'Location data not available', locations: [] },
};

export const getGeoLocationData = (country_code: ICountryCode) => {
  const data = GEO_LOCATION_DATA[country_code];
  if (data) {
    return data;
  } else {
    console.warn(`No geolocation data stored for ${country_code}. Using placeholder data`);
    return GEO_LOCATION_PLACEHOLDER;
  }
};
