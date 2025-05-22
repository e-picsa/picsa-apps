import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import { IFarmerContent } from '../../types';

const title = translateMarker('Beyond PICSA');

const steps: IFarmerContent['steps'] = [];

const content: Omit<IFarmerContent, 'id' | 'icon_path'> = {
  slug: 'beyond-picsa',
  title,
  tags: [{ label: 'Digital Skills', color: 'secondary' }],
  steps,
};
export default content;
