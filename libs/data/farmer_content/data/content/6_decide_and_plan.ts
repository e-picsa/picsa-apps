import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { IFarmerContent } from '../../types';

const title = translateMarker('You decide and make a plan');

const steps: IFarmerContent['steps'] = [];

const content: Omit<IFarmerContent, 'id' | 'icon_path'> = {
  slug: 'decide-and-plan',
  title,
  tags: [],
  steps,
  disabled: true,
};
export default content;
