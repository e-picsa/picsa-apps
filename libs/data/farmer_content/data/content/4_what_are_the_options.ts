import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { IFarmerContent } from '../../types';
import { TOOLS_DATA_HASHMAP } from '../tools';
import { PICSA_FARMER_VIDEOS_HASHMAP } from '@picsa/data/resources';

const title = translateMarker('What changes can you make?');

const steps: IFarmerContent['steps'] = [
  [
    {
      type: 'text',
      title,
    },
    {
      type: 'video',
      video: PICSA_FARMER_VIDEOS_HASHMAP.options,
    },
  ],
  [
    {
      type: 'tool',
      tool: TOOLS_DATA_HASHMAP.options,
    },
  ],
  [{ type: 'review' }],
];

const content: Omit<IFarmerContent, 'id' | 'icon_path'> = {
  slug: 'what-are-the-options',
  title,
  tags: [{ label: translateMarker('Options') }],
  steps,
};
export default content;
