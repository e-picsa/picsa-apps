import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { PICSA_FARMER_VIDEO_RESOURCES } from '@picsa/resources/src/app/data/picsa/farmer-videos';
import { IFarmerContent, IFarmerContentStep } from '../../types';
import { TOOLS_DATA_HASHMAP } from '../tools';

const { climate } = TOOLS_DATA_HASHMAP;

const steps: IFarmerContentStep[] = [
  {
    type: 'video',
    resource: PICSA_FARMER_VIDEO_RESOURCES.mw_ny['360p'].historic_climate,
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
