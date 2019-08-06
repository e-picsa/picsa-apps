import { IDBDoc } from '@picsa/models/db.models';

export interface IBudget extends IDBDoc {
  data: IBudgetPeriodData[];
  meta: IBudgetMeta;
  apiVersion: number;
}

export interface IBudgetPeriodData {
  activities: IActivityCard[];
  inputs: IInputCard[];
  outputs: IOutputCard[];
  familyLabour: any;
  produceConsumed: any;
}
// i.e. 'activities' | 'inputs' | ... use with 'key in IBudgetPeriodType' for asserting on objects
export type IBudgetPeriodType = keyof IBudgetPeriodData;

export interface IBudgetMeta {
  title: string;
  description: string;
  lengthScale: IEnterpriseScaleLentgh;
  lengthTotal: number;
  monthStart?: number;
  valueScale: 0.1 | 1 | 10 | 100;
  enterprise: IEnterprise;
}

export type IEnterpriseScaleLentgh = 'months' | 'weeks' | 'days';

/***************************************************************************** */
export interface IBudgetActiveCell {
  periodIndex: number;
  typeKey: IBudgetPeriodType;
  value?: IBudgetPeriodData;
}

/***************************************************************************** */
// hardcoded database data
export interface IBudgetDBData {
  activities: IActivityCard[];
  inputs: IInputCard[];
  outputs: IOutputCard[];
  enterprises: IEnterprise[];
}
// cards contain additional grouping (e.g. enterprise type) along with isSelected and selectedIndex populated when
// attached to budget data
export interface IBudgetCard {
  name: string;
  id: string;
  type?: string;
  isSelected?: boolean;
  selectedIndex?: number;
  quantity?: number;
  consumed?: number;
  cost?: number;
}

export interface ICustomBudgetCard extends IBudgetCard {
  custom: boolean;
  customImg: string;
  created: string;
  createdBy: string;
}

export interface IActivityCard extends IBudgetCard {}
export interface IInputCard extends IBudgetCard {
  // Type: "input";
  quantity?: number;
  total?: number;
  dots?: any[];
  cost?: number;
}
export interface IOutputCard extends IBudgetCard {
  // Type: "output";
  quantity?: number;
  total?: number;
  dots?: any[];
  cost?: number;
  consumed?: number;
}

export interface ICustomCards {
  enterprises: IBudgetCard[];
  inputs: IInputCard[];
  outputs: IOutputCard[];
}
/***************************************************************************** */
export interface IEnterprise {
  type: string;
  name: string;
  id: string;
  defaults?: IEnterpriseDefaults;
}
export interface IEnterpriseDefaults extends Partial<IBudgetMeta> {
  lengthScale: IEnterpriseScaleLentgh;
  valueScale: 0.1 | 1 | 10 | 100;
}
/***************************************************************************** */
export interface IBudgetPublicData {
  customCards?: { ['id']: ICustomBudgetCard };
  templates?: { ['id']: IBudget };
}

// export interface IBudgetDotValues {
//   large: number;
//   medium: number;
//   small: number;
//   half: number;
// }
