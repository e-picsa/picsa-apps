import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { IFarmerContent } from '../../types';
import { FARMER_TOOLS_DATA_HASHMAP } from '../tools';
import { PICSA_FARMER_VIDEOS_HASHMAP, PICSA_OPERATIONAL_VIDEOS_HASHMAP } from '@picsa/data/resources';

const title = translateMarker('Are the changes a good idea?');

const steps: IFarmerContent['steps'] = [
  {
    type: 'video',
    video: PICSA_FARMER_VIDEOS_HASHMAP.participatory_budget,
    title: translateMarker('Participatory Budgets'),
  },
  {
    type: 'video',
    video: PICSA_OPERATIONAL_VIDEOS_HASHMAP.participatory_budget,
    title: translateMarker('Using The Tool'),
  },

  {
    type: 'tool',
    tool: FARMER_TOOLS_DATA_HASHMAP.budget,
    title: translateMarker('Interactive Tool'),
  },
  {
    type: 'review',
    title: translateMarker('Review'),
  },
];

const content: Omit<IFarmerContent, 'id' | 'icon_path'> = {
  slug: 'compare-options',
  title,
  tags: [{ label: FARMER_TOOLS_DATA_HASHMAP.budget.label }],
  steps,
};
export default content;
