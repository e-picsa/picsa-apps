import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { IFarmerContent } from '../../types';
import { TOOLS_DATA_HASHMAP } from '../tools';
import { PICSA_FARMER_VIDEOS_HASHMAP } from '@picsa/data/resources';

const title = translateMarker('What do you currently do?');

const steps: IFarmerContent['steps'] = [
  [
    { type: 'text', title: translateMarker('Resource Allocation Map') },
    {
      type: 'video',
      video: PICSA_FARMER_VIDEOS_HASHMAP.ram,
    },
  ],
  [
    { type: 'text', title: translateMarker('Seasonal Calendar') },
    {
      type: 'video',
      video: PICSA_FARMER_VIDEOS_HASHMAP.seasonal_calendar,
    },
  ],
  [{ type: 'tool', tool: TOOLS_DATA_HASHMAP.seasonal_calendar }],
  [{ type: 'review' }],
];

const content: Omit<IFarmerContent, 'id' | 'icon_path'> = {
  slug: 'what-do-you-currently-do',
  title,
  tags: [{ label: translateMarker('Resource Allocation Map') }, { label: TOOLS_DATA_HASHMAP.seasonal_calendar.label }],
  steps,
};
export default content;
