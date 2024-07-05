import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { arrayToHashmap } from '@picsa/utils';
import { IToolData } from './types';

/*******************************************************************
 * Farmer Tools
 ********************************************************************/

// TODO - consider including svgIcons and using for extension tool also (refactor to folder and icon pack)
const TOOLS_BASE = {
  seasonal_calendar: { label: translateMarker('Seasonal Calendar') },
  resource_allocation_map: { label: translateMarker('Resource Allocation Map') },
  climate: { label: translateMarker('Climate') },
  probability_and_risk: { label: translateMarker('Probability and Risk') },
  options: { label: translateMarker('Options') },
};
export type IToolId = keyof typeof TOOLS_BASE;

const TOOLS_DATA: IToolData[] = Object.entries(TOOLS_BASE).map(([id, data]) => ({ ...data, id: id as IToolId }));
export const TOOLS_DATA_HASHMAP: Record<IToolId, IToolData> = arrayToHashmap(TOOLS_DATA, 'id');
