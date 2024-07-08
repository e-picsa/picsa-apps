import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { IFarmerContent, IFarmerContentStep } from '../../types';
import { TOOLS_DATA_HASHMAP } from '../tools';

const {} = TOOLS_DATA_HASHMAP;

const steps: IFarmerContentStep[] = [];

const content: Omit<IFarmerContent, 'id' | 'icon_path'> = {
  slug: 'use-forecasts',
  title: translateMarker('Use the forecasts to update and adapt your plans'),
  tools: [],
  tags: [],
  steps,
  disabled: true,
};
export default content;
