import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { IFarmerContent } from '../../types';
import { PICSA_FARMER_VIDEOS_HASHMAP } from '@picsa/data/resources';

const title = translateMarker('Use the forecasts to update and adapt your plans');

const steps: IFarmerContent['steps'] = [
  {
    type: 'video',
    video: PICSA_FARMER_VIDEOS_HASHMAP.seasonal_forecast,
    title: translateMarker('Seasonal Forecast'),
  },
  {
    type: 'video',
    video: PICSA_FARMER_VIDEOS_HASHMAP.short_term_forecast,
    title: translateMarker('Short Term Forecast'),
  },
];

const content: Omit<IFarmerContent, 'id' | 'icon_path'> = {
  slug: 'use-forecasts',
  title,
  tags: [],
  steps,
};
export default content;
