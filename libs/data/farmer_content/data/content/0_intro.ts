import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { IFarmerContent, IFarmerContentStep } from '../../types';
import {
  PICSA_FARMER_VIDEOS_HASHMAP,
  PICSA_VIDEO_TESTIMONIAL_DATA,
  PICSA_OPERATIONAL_VIDEOS_HASHMAP,
} from '@picsa/data/resources';

const title = translateMarker('What is PICSA?');

const steps: IFarmerContent['steps'] = [
  [
    { type: 'text', title },
    { type: 'video', video: PICSA_FARMER_VIDEOS_HASHMAP.intro },
  ],
  [
    {
      type: 'text',
      title: translateMarker('Testimonials'),
    },
    ...PICSA_VIDEO_TESTIMONIAL_DATA.map(
      (video): IFarmerContentStep => ({
        type: 'video',
        video,
      })
    ),
  ],
  [
    { type: 'text', title: translateMarker('App') },
    { type: 'video', video: PICSA_OPERATIONAL_VIDEOS_HASHMAP.intro },
  ],
];

const content: Omit<IFarmerContent, 'id' | 'icon_path'> = {
  slug: 'intro',
  title,
  steps,
  tags: [{ label: translateMarker('Tutorials'), color: 'secondary' }],
};
export default content;
