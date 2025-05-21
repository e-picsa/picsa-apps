import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { IFarmerContent } from '../../types';
import { TOOLS_DATA_HASHMAP } from '../tools';
import { PICSA_FARMER_VIDEOS_HASHMAP, PICSA_OPERATIONAL_VIDEOS_HASHMAP } from '@picsa/data/resources';

const title = translateMarker('What is happening to the climate in your area?');

const steps: IFarmerContent['steps'] = [
  {
    type: 'video',
    video: PICSA_FARMER_VIDEOS_HASHMAP.historic_climate,
    title: translateMarker('Historic Climate'),
  },
  {
    type: 'video',
    video: PICSA_OPERATIONAL_VIDEOS_HASHMAP.historic_climate,
    title: translateMarker('Using The Tool'),
  },
  {
    type: 'tool',
    tool: TOOLS_DATA_HASHMAP.climate,
    title: translateMarker('Interactive Tool'),
  },
  { type: 'review', title: translateMarker('Review') },
];

const content: Omit<IFarmerContent, 'id' | 'icon_path'> = {
  slug: 'is-the-climate-changing',
  title,
  tags: [{ label: TOOLS_DATA_HASHMAP.climate.label }],
  steps,
};
export default content;
