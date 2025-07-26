import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import MW_DISTRICTS from './mw/districts';
import { ICountryCode } from '../deployments';
import { IGelocationData } from './types';
import ZM_PROVINCES from './zm/provinces';
import ZM_DISTRICTS from './zm/districts';

export * from './utils';
export * from './types';

export const GEO_LOCATION_DATA: { [country_code in ICountryCode]?: IGelocationData } = {
  mw: {
    admin_4: {
      label: translateMarker('District'),
      topoJson: async () => {
        const res = await import('./mw/admin-4.osm.topo.json');
        return res.default;
      },
      locations: MW_DISTRICTS,
    },
  },
  zm: {
    admin_4: {
      label: translateMarker('Province'),
      topoJson: async () => {
        const res = await import('./zm/admin-4.osm.topo.json');
        return res.default;
      },
      locations: ZM_PROVINCES,
    },
    admin_5: {
      label: translateMarker('District'),
      locations: ZM_DISTRICTS,
    },
  },
};

export const GEO_LOCATION_PLACEHOLDER: IGelocationData = {
  admin_4: { label: 'Location data not available', locations: [], topoJson: async () => ({}) as any },
};
