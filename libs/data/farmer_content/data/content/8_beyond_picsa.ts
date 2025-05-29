import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { IFarmerContent } from '../../types';
import { PICSA_VIDEO_DIGITAL_SKILLS_DATA } from '@picsa/data/resources/videos/digitalSkills';

const title = translateMarker('Beyond PICSA');

const steps: IFarmerContent['steps'] = [
  {
    type: 'videoPlaylist',
    title,
    videos: PICSA_VIDEO_DIGITAL_SKILLS_DATA,
  },
];

const content: Omit<IFarmerContent, 'id' | 'icon_path'> = {
  slug: 'beyond-picsa',
  title,
  tags: [{ label: 'Digital Skills', color: 'secondary' }],
  steps,
  stepNumber: -1,
};
export default content;
