import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { PICSA_FARMER_VIDEO_RESOURCES } from '@picsa/resources/src/app/data/picsa/farmer-videos';
import { IFarmerContent, IFarmerContentStep } from '../../types';
import { TOOLS_DATA_HASHMAP } from '../tools';

const { seasonal_calendar } = TOOLS_DATA_HASHMAP;

const steps: IFarmerContentStep[] = [
  {
    type: 'video',
    resource: PICSA_FARMER_VIDEO_RESOURCES.mw_ny['360p'].ram,
    tabLabel: translateMarker('Ram'),
  },
  {
    type: 'video',
    resource: PICSA_FARMER_VIDEO_RESOURCES.mw_ny['360p'].seasonal_calendar,
    tabLabel: translateMarker('Calendar'),
  },
];

const content: Omit<IFarmerContent, 'id' | 'icon_path'> = {
  slug: 'what-do-you-currently-do',
  title: translateMarker('What do you currently do?'),
  tools: [seasonal_calendar],
  tags: [],
  steps,
};
export default content;
