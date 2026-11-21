import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import type { IGeolocationData } from '../types';
import ZM_DISTRICTS from './districts';
import ZM_PROVINCES from './provinces';

export const ZM_GEOLOCATION_DATA: IGeolocationData = {
  topoJson: async () => (await import('./ZM.topo.json')).default,
  layers: [
    {
      key: 'province',
      label: translateMarker('Province'),
      topoAdminLevel: 4,
      locations: ZM_PROVINCES.map((p) => ({ ...p })),
    },
    {
      key: 'district',
      label: translateMarker('District'),
      parentLayer: 'province',
      topoAdminLevel: 5,
      locations: ZM_DISTRICTS.map(({ province, ...rest }) => ({ ...rest, parentId: province })),
    },
  ],
  toolLayers: {
    cropProbability: 'district',
    forecast: 'district',
    climate: 'district',
  },
};
