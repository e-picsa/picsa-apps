import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import type { IGeolocationData } from '../types';
import MW_DISTRICTS from './districts';

export const MW_GEOLOCATION_DATA: IGeolocationData = {
  topoJson: async () => (await import('./MW.topo.json')).default,
  layers: [
    {
      key: 'district',
      label: translateMarker('District'),
      topoAdminLevel: 4,
      locations: MW_DISTRICTS.map((d) => ({ ...d })),
    },
  ],
  toolLayers: {
    cropProbability: 'district',
    forecast: 'district',
    climate: 'district',
  },
};
