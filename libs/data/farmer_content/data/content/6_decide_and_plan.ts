import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

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
  showReviewSection: true,
};
export default content;
