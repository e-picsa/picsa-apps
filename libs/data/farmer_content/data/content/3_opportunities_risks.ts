import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { IFarmerContent } from '../../types';
import { FARMER_TOOLS_DATA_HASHMAP } from '../tools';
import { PICSA_FARMER_VIDEOS_HASHMAP } from '@picsa/data/resources';

const title = translateMarker('What are the opportunities and risk?');

const steps: IFarmerContent['steps'] = [
  {
    type: 'video',
    video: PICSA_FARMER_VIDEOS_HASHMAP.probability_risk,
    title: translateMarker('Probability and Risk'),
  },
  { type: 'tool', tool: FARMER_TOOLS_DATA_HASHMAP.crop_probability, title: translateMarker('Interactive Tool') },
  { type: 'review', title: translateMarker('Review') },
];

const content: Omit<IFarmerContent, 'id' | 'icon_path'> = {
  slug: 'opportunities-and-risk',
  title,
  tags: [{ label: FARMER_TOOLS_DATA_HASHMAP.crop_probability.label }],
  steps,
};
export default content;
