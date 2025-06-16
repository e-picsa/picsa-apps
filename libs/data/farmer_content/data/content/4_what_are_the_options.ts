import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { IFarmerContent } from '../../types';
import { FARMER_TOOLS_DATA_HASHMAP } from '../tools';
import { PICSA_FARMER_VIDEOS_HASHMAP, PICSA_OPERATIONAL_VIDEOS_HASHMAP } from '@picsa/data/resources';

const title = translateMarker('What changes can you make?');

const steps: IFarmerContent['steps'] = [
  {
    type: 'video',
    video: PICSA_FARMER_VIDEOS_HASHMAP.options,
    title: translateMarker('Options'),
  },

  { type: 'video', video: PICSA_OPERATIONAL_VIDEOS_HASHMAP.options, title: translateMarker('Using The tool') },

  {
    type: 'tool',
    tool: FARMER_TOOLS_DATA_HASHMAP.option,
    title: translateMarker('Interactive Tool'),
  },

  { type: 'review', title: translateMarker('Review') },
];

const content: Omit<IFarmerContent, 'id' | 'icon_path'> = {
  slug: 'what-are-the-options',
  title,
  tags: [{ label: translateMarker('Options') }],
  steps,
};
export default content;
