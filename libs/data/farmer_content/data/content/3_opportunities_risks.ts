import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { PICSA_FARMER_VIDEO_RESOURCES } from '@picsa/resources/src/app/data/picsa/farmer-videos';
import { IFarmerContent, IFarmerContentStep } from '../../types';
import { TOOLS_DATA_HASHMAP } from '../tools';

const { probability_and_risk } = TOOLS_DATA_HASHMAP;

const steps: IFarmerContentStep[] = [
  {
    type: 'video',
    resource: PICSA_FARMER_VIDEO_RESOURCES.mw_ny['360p'].probability_risk,
  },
];

const content: Omit<IFarmerContent, 'id' | 'icon_path'> = {
  slug: 'opportunities-and-risk',
  title: translateMarker('What are the opportunities and risk?'),
  tools: [probability_and_risk],
  tags: [],
  steps,
};
export default content;
