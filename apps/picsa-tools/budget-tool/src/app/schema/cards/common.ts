import type { IBudgetPeriodType } from '../../models/budget-tool.models';
import { IBudgetCard } from '.';

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
