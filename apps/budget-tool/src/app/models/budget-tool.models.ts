import { IDBDoc } from '@picsa/models/db.models';

export interface IBudget extends IDBDoc {
  data: IBudgetPeriodData[];
  meta: IBudgetMeta;
  apiVersion: number;
}

// NOTE - keep all value formats as arrays to make easier to work with generally
export interface IBudgetPeriodData {
  activities: IBudgetCard[];
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
export type IBudgetValueScale = 0.1 | 1 | 10;
/***************************************************************************** */
export interface IBudgetActiveCell {
  periodIndex: number;
  periodLabel: string;
  typeKey: IBudgetPeriodType;
  typeLabel: string;
  // manually adapted from IBudgetPeriodData above as automated typings difficult
  cellData: IBudgetCardWithValues[] | IBudgetCard[];
}

/***************************************************************************** */

// cards are used for budget table population as well as enterprise
export interface IBudgetCard {
  // id used as well as key to easier specify image (and be non-unique for things like inputs and outputs)
  id: string;
  label: string;
  type: IBudgetPeriodType | 'enterprise';
  groupings?: string[];
  customMeta?: IBudgetCardCustomMeta;
  values?: IBudgetCardValues;
  imgType?: 'svg' | 'png';
}
export type IBudgetCardDB = IBudgetCard & IDBDoc;

interface IBudgetCardWithValues extends IBudgetCard {
  values: IBudgetCardValues;
}

interface IBudgetCardCustomMeta {
  imgData: string;
  dateCreated: string;
  createdBy: string;
}
interface IBudgetCardValues {
  quantity: number;
  cost: number;
}

/***************************************************************************** */
export interface IBudgetDatabase {
  cards: IBudgetCard[];
}

// export interface IActivityCard extends IBudgetCard {}
// export interface IInputCard extends IBudgetCard {
//   // Type: "input";
//   quantity?: number;
//   total?: number;
//   dots?: any[];
//   cost?: number;
// }
// export interface IOutputCard extends IBudgetCard {
//   // Type: "output";
//   quantity?: number;
//   total?: number;
//   dots?: any[];
//   cost?: number;
//   consumed?: number;
// }

// export interface ICustomCards {
//   enterprises: IBudgetCard[];
//   inputs: IInputCard[];
//   outputs: IOutputCard[];
// }

// export interface IBudgetDotValues {
//   large: number;
//   medium: number;
//   small: number;
//   half: number;
// }
