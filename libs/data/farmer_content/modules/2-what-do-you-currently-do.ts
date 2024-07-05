import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { TOOLS_DATA_HASHMAP } from '../tools';
import { IFarmerContent } from '../types';

const { seasonal_calendar, resource_allocation_map } = TOOLS_DATA_HASHMAP;

const content: IFarmerContent = {
  slug: 'what-do-you-currently-do',
  title: translateMarker('What do you currently do?'),
  tools: [seasonal_calendar, resource_allocation_map],
  tags: [],
  icon_path: '',
  id: 'what_do_you_currently_do',
  content: [
    {
      type: 'title',
      text: translateMarker('Resource Allocation Map'),
    },
    {
      type: 'video',
      storagePath: `picsa/videos/farmer/ram_intro`,
    },
    {
      type: 'text',
      html: '<p>Example Text</p>',
    },
  ],
};

export default content;
