import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { IFarmerContent, IFarmerContentStep } from '../../types';
import { TOOLS_DATA_HASHMAP } from '../tools';
import { PICSA_FARMER_VIDEOS_HASHMAP } from '@picsa/data/resources';

const { options } = TOOLS_DATA_HASHMAP;

const steps: IFarmerContentStep[] = [
  {
    type: 'video',
    video: PICSA_FARMER_VIDEOS_HASHMAP.options,
  },
];

const content: Omit<IFarmerContent, 'id' | 'icon_path'> = {
  slug: 'what-are-the-options',
  title: translateMarker('What changes can you make?'),
  tools: [options],
  tags: [],
  steps,
};
export default content;
