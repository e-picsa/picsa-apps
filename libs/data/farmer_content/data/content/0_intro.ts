import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { PICSA_FARMER_VIDEO_RESOURCES } from '@picsa/resources/src/app/data/picsa/farmer-videos';
import { IFarmerContent, IFarmerContentStep } from '../../types';

const steps: IFarmerContentStep[] = [];

const content: Omit<IFarmerContent, 'id' | 'icon_path'> = {
  slug: 'intro',
  title: translateMarker('What is PICSA?'),
  tools: [],
  tags: [{ label: translateMarker('Tutorials') }],
  steps,
  disabled: true,
};
export default content;
