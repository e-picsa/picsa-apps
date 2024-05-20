import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { arrayToHashmap } from '@picsa/utils';

interface IEnterpriseData {
  id: 'crop' | 'livestock' | 'livelihood';
  /** Label shown during enterprise select */
  label: string;
  /** Image shown during enterprise select */
  image: string;
  /** Page title shown when enterprise selected */
  title: string;
}

export const ENTERPRISE_DATA: IEnterpriseData[] = [
  {
    id: 'crop',
    label: translateMarker('Crop'),
    image: 'assets/svgs/crop-enterprise.svg',
    title: translateMarker('Crop Options'),
  },
  {
    id: 'livestock',
    label: translateMarker('Livestock'),
    image: 'assets/svgs/livestock-enterprise.svg',
    title: translateMarker('Livestock Options'),
  },
  {
    id: 'livelihood',
    label: translateMarker('Livelihood'),
    image: 'assets/svgs/livelihood-enterprise.svg',
    title: translateMarker('Livelihood Options'),
  },
];

export const ENTERPRISES_BY_ID = arrayToHashmap(ENTERPRISE_DATA, 'id');
