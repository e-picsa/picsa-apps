import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { IFarmerContent, IFarmerContentStep } from '../../types';
import { TOOLS_DATA_HASHMAP } from '../tools';
import { PICSA_FARMER_VIDEOS_HASHMAP } from '@picsa/data/resources';

const { seasonal_calendar } = TOOLS_DATA_HASHMAP;

const steps: IFarmerContentStep[] = [
  {
    type: 'video',
    video: PICSA_FARMER_VIDEOS_HASHMAP.ram,
    tabLabel: translateMarker('Ram'),
  },
  {
    type: 'video',
    video: PICSA_FARMER_VIDEOS_HASHMAP.seasonal_calendar,
    tabLabel: translateMarker('Calendar'),
  },
];

const content: Omit<IFarmerContent, 'id' | 'icon_path'> = {
  slug: 'what-do-you-currently-do',
  title: translateMarker('What do you currently do?'),
  tools: [seasonal_calendar],
  tags: [{ label: translateMarker('Resource Allocation Map') }],
  steps,
  showReviewSection: true,
};
export default content;
