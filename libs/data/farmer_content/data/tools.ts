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

// Utility type to use with const for derived keys and defined value types
type DataMapWithValues = Partial<Record<IToolsID, IFarmerToolDataBase>>;

/** Specific overrides for tool data when displayed in farmer app */
const FARMER_TOOLS_BASE = {
  budget: { showHeader: true },
  climate: { showHeader: true },
  crop_probability: { label: translateMarker('Probability and Risk') },
  option: {},
  seasonal_calendar: {},
} as const satisfies DataMapWithValues;

type IFarmerToolId = keyof typeof FARMER_TOOLS_BASE;

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
export const FARMER_TOOLS_DATA_HASHMAP: Record<IFarmerToolId, IFarmerToolData> = arrayToHashmap(
  FARMER_TOOLS_DATA,
  'id',
);
