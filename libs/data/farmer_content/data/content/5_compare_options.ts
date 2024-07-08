import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { PICSA_FARMER_VIDEO_RESOURCES } from '@picsa/resources/src/app/data/picsa/farmer-videos';
import { IFarmerContent, IFarmerContentStep } from '../../types';
import { TOOLS_DATA_HASHMAP } from '../tools';

const { budget } = TOOLS_DATA_HASHMAP;

const steps: IFarmerContentStep[] = [
  {
    type: 'video',
    resource: PICSA_FARMER_VIDEO_RESOURCES.mw_ny['360p'].participatory_budget,
  },
];

const content: Omit<IFarmerContent, 'id' | 'icon_path'> = {
  slug: 'compare-options',
  title: translateMarker('Are the changes a good idea?'),
  tools: [budget],
  tags: [],
  steps,
};
export default content;
