import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { ICountryCode } from '../deployments';
import { IGelocationData } from './types';

export * from './utils';
export * from './types';

export const GEO_LOCATION_DATA: { [country_code in ICountryCode]?: IGelocationData } = {
  // TODO - test prod build - might need to copy assets
  mw: {
    admin_4: {
      label: translateMarker('District'),
      data: async () => {
        const res = await import('./mw/admin-4.osm.topo.json');
        return res.default;
      },
    },
  },
  zm: {
    admin_4: {
      label: translateMarker('Province'),
      data: async () => {
        const res = await import('./zm/admin-4.osm.topo.json');
        return res.default;
      },
    },
  },
};
