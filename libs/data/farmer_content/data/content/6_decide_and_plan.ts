import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { PICSA_FARMER_VIDEO_RESOURCES } from '@picsa/resources/src/app/data/picsa/farmer-videos';
import { IFarmerContent, IFarmerContentStep } from '../../types';
import { TOOLS_DATA_HASHMAP } from '../tools';

const {} = TOOLS_DATA_HASHMAP;

const steps: IFarmerContentStep[] = [];

const content: Omit<IFarmerContent, 'id' | 'icon_path'> = {
  slug: 'decide-and-plan',
  title: translateMarker('You decide and make a plan'),
  tools: [],
  tags: [],
  steps,
  disabled: true,
};
export default content;
