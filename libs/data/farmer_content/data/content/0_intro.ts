import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { IFarmerContent, IFarmerContentStep } from '../../types';
import { PICSA_FARMER_VIDEOS_HASHMAP, PICSA_VIDEO_TESTIMONIAL_HASHMAP } from '@picsa/data/resources';

const steps: IFarmerContentStep[] = [
  { type: 'video', video: PICSA_FARMER_VIDEOS_HASHMAP.intro, tabLabel: translateMarker('Intro') },
  {
    type: 'video_playlist',
    videos: Object.values(PICSA_VIDEO_TESTIMONIAL_HASHMAP),
    tabLabel: translateMarker('Testimonials'),
    tabMatIcon: 'people',
  },
];

const content: Omit<IFarmerContent, 'id' | 'icon_path'> = {
  slug: 'intro',
  title: translateMarker('What is PICSA?'),
  tools: [],
  tags: [{ label: translateMarker('Tutorials') }],
  steps,
};
export default content;
