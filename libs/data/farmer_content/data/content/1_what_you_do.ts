import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { IFarmerContent } from '../../types';
import { FARMER_TOOLS_DATA_HASHMAP } from '../tools';
import { PICSA_FARMER_VIDEOS_HASHMAP } from '@picsa/data/resources';

const title = translateMarker('What do you currently do?');

const steps: IFarmerContent['steps'] = [
  {
    type: 'video',
    video: PICSA_FARMER_VIDEOS_HASHMAP.ram,
    title: translateMarker('Resource Allocation Map'),
  },
  {
    type: 'video',
    video: PICSA_FARMER_VIDEOS_HASHMAP.seasonal_calendar,
    title: translateMarker('Seasonal Calendar'),
  },
  { type: 'tool', tool: FARMER_TOOLS_DATA_HASHMAP.seasonal_calendar, title: 'Interactive Tool' },
  { type: 'review', title: translateMarker('Review') },
];

const content: Omit<IFarmerContent, 'id' | 'icon_path'> = {
  slug: 'what-do-you-currently-do',
  title,
  tags: [
    { label: translateMarker('Resource Allocation Map') },
    { label: FARMER_TOOLS_DATA_HASHMAP.seasonal_calendar.label },
  ],
  steps,
};
export default content;
