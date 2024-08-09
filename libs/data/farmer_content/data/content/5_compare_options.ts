import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { IFarmerContent, IFarmerContentStep } from '../../types';
import { TOOLS_DATA_HASHMAP } from '../tools';
import { PICSA_FARMER_VIDEOS_HASHMAP } from '@picsa/data/resources';

const { budget } = TOOLS_DATA_HASHMAP;

const steps: IFarmerContentStep[] = [
  {
    type: 'video',
    video: PICSA_FARMER_VIDEOS_HASHMAP.participatory_budget,
  },
];

const content: Omit<IFarmerContent, 'id' | 'icon_path'> = {
  slug: 'compare-options',
  title: translateMarker('Are the changes a good idea?'),
  tools: [budget],
  tags: [],
  steps,
  showReviewSection: true,
};
export default content;
