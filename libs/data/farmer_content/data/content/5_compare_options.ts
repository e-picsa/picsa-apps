import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { IFarmerContent } from '../../types';
import { TOOLS_DATA_HASHMAP } from '../tools';
import { PICSA_FARMER_VIDEOS_HASHMAP } from '@picsa/data/resources';

const title = translateMarker('Are the changes a good idea?');

const steps: IFarmerContent['steps'] = [
  [
    { type: 'text', title },
    {
      type: 'video',
      video: PICSA_FARMER_VIDEOS_HASHMAP.participatory_budget,
    },
  ],
  [
    {
      type: 'tool',
      tool: TOOLS_DATA_HASHMAP.budget,
    },
  ],
  [
    {
      type: 'review',
    },
  ],
];

const content: Omit<IFarmerContent, 'id' | 'icon_path'> = {
  slug: 'compare-options',
  title,
  tags: [{ label: TOOLS_DATA_HASHMAP.budget.label }],
  steps,
};
export default content;
