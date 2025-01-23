import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { IFarmerContent } from '../../types';
import { TOOLS_DATA_HASHMAP } from '../tools';
import { PICSA_FARMER_VIDEOS_HASHMAP } from '@picsa/data/resources';

const title = translateMarker('What are the opportunities and risk?');

const steps: IFarmerContent['steps'] = [
  [
    { type: 'text', title },
    {
      type: 'video',
      video: PICSA_FARMER_VIDEOS_HASHMAP.probability_risk,
    },
  ],
  [{ type: 'tool', tool: TOOLS_DATA_HASHMAP.probability_and_risk }],
  [{ type: 'review' }],
];

const content: Omit<IFarmerContent, 'id' | 'icon_path'> = {
  slug: 'opportunities-and-risk',
  title,
  tags: [{ label: TOOLS_DATA_HASHMAP.probability_and_risk.label }],
  steps,
};
export default content;
