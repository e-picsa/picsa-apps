import { IDBDoc } from '@picsa/models';

import { IBudgetCard, IBudgetCardWithValues } from '../schema';

export interface IBudget extends IDBDoc {
  data: IBudgetPeriodData[];
  meta: IBudgetMeta;
  apiVersion: number;
  shareCode?: string;
  _appVersion: string;
}

// NOTE - keep all value formats as arrays to make easier to work with generally
export interface IBudgetPeriodData {
  activities: IBudgetCardWithValues[];
  inputs: IBudgetCardWithValues[];
  outputs: IBudgetCardWithValues[];
  familyLabour: IBudgetCardWithValues[];
  produceConsumed: IBudgetCardWithValues[];
}
// i.e. 'activities' | 'inputs' | ... use with 'key in IBudgetPeriodType' for asserting on objects
export type IBudgetPeriodType = keyof IBudgetPeriodData;

export interface IBudgetMeta {
  title: string;
  description: string;
  lengthScale: IEnterpriseScaleLentgh;
  lengthTotal: number;
  monthStart?: number;
  valueScale: IBudgetValueScale;
  enterprise: IBudgetCard;
}

export type IEnterpriseScaleLentgh = 'months' | 'weeks' | 'days';
// budget counters scaled in multiples of 10
export type IBudgetValueScale = number;
// counters form 2 arrays, one with a list of labels (/images) and the next with values
// values are in descending order
export type IBudgetValueCounters = [string[], number[]];
/***************************************************************************** */

// query params are used to track which cell is being edited
export interface IBudgetQueryParams {
  period: string;
  label: string;
  type: IBudgetPeriodType;
}
// active cell data is calculated separately by store
export interface IBudgetActiveCell extends IBudgetQueryParams {
  data: IBudgetCardWithValues[];
}

/***************************************************************************** */
export interface IBudgetDatabase {
  cards: IBudgetCard[];
}

export type IBudgetBalance = IBudgetPeriodBalance[];

interface IBudgetPeriodBalance {
  period: number;
  running: number;
}

export interface IBudgetCodeDoc extends IDBDoc {
  budget_key: string;
}
