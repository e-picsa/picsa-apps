import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { IFarmerContent } from '../../types';

const title = translateMarker('Use the forecasts to update and adapt your plans');

const steps: IFarmerContent['steps'] = [];

const content: Omit<IFarmerContent, 'id' | 'icon_path'> = {
  slug: 'use-forecasts',
  title,
  tags: [],
  steps,
  disabled: true,
};
export default content;
