import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { IFarmerContent, IFarmerContentStep } from '../../types';
import {
  PICSA_FARMER_VIDEOS_HASHMAP,
  PICSA_VIDEO_TESTIMONIAL_DATA,
  PICSA_OPERATIONAL_VIDEOS_HASHMAP,
} from '@picsa/data/resources';

const steps: IFarmerContentStep[] = [
  { type: 'video', video: PICSA_FARMER_VIDEOS_HASHMAP.intro, title: translateMarker('Introduction') },
  {
    type: 'videoPlaylist',
    title: translateMarker('Testimonials'),
    videos: PICSA_VIDEO_TESTIMONIAL_DATA,
  },
  { type: 'video', video: PICSA_OPERATIONAL_VIDEOS_HASHMAP.intro, title: translateMarker('Using the App') },
];

const content: Omit<IFarmerContent, 'id' | 'icon_path'> = {
  slug: 'intro',
  title: translateMarker('What is PICSA?'),
  steps,
  tags: [{ label: translateMarker('Tutorials'), color: 'secondary' }],
  stepNumber: -1,
};
export default content;
