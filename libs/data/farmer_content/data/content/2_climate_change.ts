import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { IFarmerContent } from '../../types';
import { TOOLS_DATA_HASHMAP } from '../tools';
import { PICSA_FARMER_VIDEOS_HASHMAP, PICSA_OPERATIONAL_VIDEOS_HASHMAP } from '@picsa/data/resources';

const title = translateMarker('What is happening to the climate in your area?');

const steps: IFarmerContent['steps'] = [
  [
    {
      type: 'text',
      title,
    },
    {
      type: 'video',
      video: PICSA_FARMER_VIDEOS_HASHMAP.historic_climate,
    },
  ],
  [
    { type: 'text', title: translateMarker('Tool') },
    { type: 'video', video: PICSA_OPERATIONAL_VIDEOS_HASHMAP.historic_climate },
  ],
  [
    {
      type: 'tool',
      tool: TOOLS_DATA_HASHMAP.climate,
    },
  ],
  [{ type: 'review' }],
];

const content: Omit<IFarmerContent, 'id' | 'icon_path'> = {
  slug: 'is-the-climate-changing',
  title,
  tags: [{ label: TOOLS_DATA_HASHMAP.climate.label }],
  steps,
};
export default content;
