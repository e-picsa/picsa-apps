import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { IFarmerContent, IFarmerContentStep } from '../../types';
import { TOOLS_DATA_HASHMAP } from '../tools';
import { PICSA_FARMER_VIDEOS_HASHMAP } from '@picsa/data/resources';

const { climate } = TOOLS_DATA_HASHMAP;

const steps: IFarmerContentStep[] = [
  {
    type: 'video',
    video: PICSA_FARMER_VIDEOS_HASHMAP.historic_climate,
  },
];

const content: Omit<IFarmerContent, 'id' | 'icon_path'> = {
  slug: 'is-the-climate-changing',
  title: translateMarker('What is happening to the climate in your area?'),
  tools: [climate],
  tags: [],
  steps,
};
export default content;
