import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { IFarmerContent, IFarmerContentStep } from '../../types';
import { TOOLS_DATA_HASHMAP } from '../tools';
import { PICSA_FARMER_VIDEOS_HASHMAP } from '@picsa/data/resources';

const { probability_and_risk } = TOOLS_DATA_HASHMAP;

const steps: IFarmerContentStep[] = [
  {
    type: 'video',
    video: PICSA_FARMER_VIDEOS_HASHMAP.probability_risk,
  },
];

const content: Omit<IFarmerContent, 'id' | 'icon_path'> = {
  slug: 'opportunities-and-risk',
  title: translateMarker('What are the opportunities and risk?'),
  tools: [probability_and_risk],
  tags: [],
  steps,
  showReviewSection: true,
};
export default content;
