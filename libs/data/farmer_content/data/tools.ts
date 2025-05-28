import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { TOOLS_DATA_HASHMAP } from '../../tools';

/*******************************************************************
 * Farmer Tools
 ********************************************************************/

import { arrayToHashmap } from '@picsa/utils';
import { IToolData } from '../types';

const FARMER_TOOLS_BASE = {
  budget: { ...TOOLS_DATA_HASHMAP.budget, showHeader: true },
  climate: { ...TOOLS_DATA_HASHMAP.climate, showHeader: true },
  options: { ...TOOLS_DATA_HASHMAP.option },
  probability_and_risk: { ...TOOLS_DATA_HASHMAP.crop_probability, label: translateMarker('Probability and Risk') },
  seasonal_calendar: { ...TOOLS_DATA_HASHMAP.seasonal_calendar },
};

export type IFarmerToolId = keyof typeof FARMER_TOOLS_BASE;

export const FARMER_TOOLS_DATA: IToolData[] = Object.entries(FARMER_TOOLS_BASE).map(([id, data]) => ({
  ...data,
  href: data.url.replace('/', ''),
  id: id as IFarmerToolId,
  title: translateMarker('Tool'),
}));
export const FARMER_TOOLS_DATA_HASHMAP: Record<IFarmerToolId, IToolData> = arrayToHashmap(FARMER_TOOLS_DATA, 'id');
