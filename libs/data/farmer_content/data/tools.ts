import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

/*******************************************************************
 * Farmer Tools
 ********************************************************************/

import { arrayToHashmap } from '@picsa/utils';
import { IToolData } from '../types';

// TODO - consider including svgIcons and using for extension tool also (refactor to folder and icon pack)
const TOOLS_BASE = {
  budget: { label: translateMarker('Budget'), href: 'budget' },
  climate: { label: translateMarker('Climate'), href: 'climate' },
  options: { label: translateMarker('Options'), href: 'option' },
  probability_and_risk: { label: translateMarker('Probability and Risk'), href: 'crop-probability' },
  // resource_allocation_map: { label: translateMarker('Resource Allocation Map'), tabLabel: translateMarker('RAM Tool') },
  seasonal_calendar: { label: translateMarker('Seasonal Calendar'), href: 'seasonal-calendar' },
};

export type IToolId = keyof typeof TOOLS_BASE;

export const TOOLS_DATA: IToolData[] = Object.entries(TOOLS_BASE).map(([id, data]) => ({ ...data, id: id as IToolId }));
export const TOOLS_DATA_HASHMAP: Record<IToolId, IToolData> = arrayToHashmap(TOOLS_DATA, 'id');
