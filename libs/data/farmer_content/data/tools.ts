import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
import { IToolsDataEntry, IToolsID, TOOLS_DATA_HASHMAP } from '../../tools';

/*******************************************************************
 * Farmer Tools
 ********************************************************************/

import { arrayToHashmap } from '@picsa/utils';

interface IFarmerToolDataBase extends Partial<IToolsDataEntry> {
  /** Show default app header of tool directly uses */
  showHeader?: boolean;
}

/** Specific overrides for tool data when displayed in farmer app */
const FARMER_TOOLS_BASE: Partial<Record<IToolsID, IFarmerToolDataBase>> = {
  budget: { showHeader: true },
  climate: { showHeader: true },
  crop_probability: { label: translateMarker('Probability and Risk') },
  option: {},
  seasonal_calendar: {},
};

export interface IFarmerToolData extends IToolsDataEntry {
  /** Show default app header of tool directly uses */
  showHeader?: boolean;
}

export const FARMER_TOOLS_DATA = Object.entries(FARMER_TOOLS_BASE).map(([id, overrides]) => {
  const data = TOOLS_DATA_HASHMAP[id] as IToolsDataEntry;
  const toolData: IFarmerToolData = {
    ...data,
    ...overrides,
    // HACK - replace leading '/' for easier use in modules
    url: data.url.replace('/', '') as any,
  };
  return toolData;
});
export const FARMER_TOOLS_DATA_HASHMAP: Record<IToolsID, IFarmerToolData> = arrayToHashmap(FARMER_TOOLS_DATA, 'id');
