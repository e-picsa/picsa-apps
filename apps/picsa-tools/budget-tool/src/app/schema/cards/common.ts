import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';

import type { IBudgetPeriodType } from '../../models/budget-tool.models';
import { IBudgetCard } from '.';

/** Specify available groupings to ensure translations included */
const BUDGET_CARD_GROUPINGS = {
  livestock: translateMarker('livestock'),
  fruits: translateMarker('fruits'),
  crop: translateMarker('crop'),
  fish: translateMarker('fish'),
  afforestation: translateMarker('afforestation'),
  '*': '*',
} as const;

export type IBudgetCardGrouping = keyof typeof BUDGET_CARD_GROUPINGS;

export type IBudgetCardType = IBudgetPeriodType | 'enterprise' | 'other';
export interface IBudgetCardWithValues extends IBudgetCard {
  values: IBudgetCardValues;
}
export interface IBudgetCardCustomMeta {
  imgData: string;
  dateCreated: string;
  createdBy: string;
}
export interface IBudgetCardValues {
  quantity: number;
  cost: number;
  total: number;
}
