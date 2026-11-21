import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import type { IGeolocationData } from '../types';
import ZW_DISTRICTS from './districts';
import ZW_PROVINCES from './provinces';

export const ZW_GEOLOCATION_DATA: IGeolocationData = {
  topoJson: async () => (await import('./ZW.topo.json')).default,
  layers: [
    {
      key: 'province',
      label: translateMarker('Province'),
      topoAdminLevel: 4,
      locations: ZW_PROVINCES.map((p) => ({ ...p })),
    },
    {
      key: 'district',
      label: translateMarker('District'),
      parentLayer: 'province',
      topoAdminLevel: 6,
      locations: ZW_DISTRICTS.map(({ province, ...rest }) => ({ ...rest, parentId: province })),
    },
  ],
  toolLayers: {
    cropProbability: 'district',
    forecast: 'district',
    climate: 'district',
  },
};
