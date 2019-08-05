import { IDBDoc } from '@picsa/models/db.models';

export interface BudgetToolState {
  active: IBudget;
  meta: IBudgetMeta;
  view?: IBudgetView;
  // no additional parameters currently specified (may change)
}

export interface IBudget extends IDBDoc {
  title: string;
  archived: boolean;
  periods: IBudgetPeriodMeta;
  description: string;
  enterprise: string;
  enterpriseType: string;
  dotValues: IBudgetDotValues;
  created: string;
  data: { [index: string]: IBudgetPeriodData };
  apiVersion: number;
}

export interface IBudgetMeta {
  activities: IBudgetCard[];
  enterprises: IEnterprise[];
  familyLabour: IBudgetCard[];
  outputs: IBudgetCard[];
  inputs: IBudgetCard[];
}

export interface IBudgetPeriodData {
  activities?: { [index: string]: IActivityCard };
  inputs?: { [index: string]: IInputCard };
  outputs?: { [index: string]: IOutputCard };
  familyLabour?: any;
  produceConsumed?: any;
}

export type IBudgetPeriodType = keyof IBudgetPeriodData;
// i.e. 'activities' | 'inputs' | ...

export interface IBudgetActiveCell {
  periodKey: string;
  periodIndex: number;
  periodLabel: string;
  typeKey: IBudgetPeriodType;
  typeIndex: number;
  typeLabel: string;
  value?: IBudgetPeriodData;
}

export interface IBudgetDotValues {
  large: number;
  medium: number;
  small: number;
  half: number;
}

export interface IBudgetView {
  component:
    | 'overview'
    | 'cell-edit'
    | 'load'
    | 'settings'
    | 'new-card'
    | 'export';
  title: string;
  icon?: string;
  meta?: any;
}

export interface IBudgetViewMeta {
  type: string;
  periodIndex: number;
}

export interface IBudgetPeriodMeta extends IEnterpriseDefaults {
  labels: month[] | week[] | string[];
  starting: number;
  scale: IEnterpriseScale;
  total: number;
}
export type IEnterpriseScale = 'months' | 'weeks';

export interface IEnterpriseDefaults {
  scale: IEnterpriseScale;
  total: number;
  starting: number;
}

// cards contain additional grouping (e.g. enterprise type) along with isSelected and selectedIndex populated when
// attached to budget data
export interface IBudgetCard extends IDBDoc {
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
export interface IEnterprise {
  type: string;
  name: string;
  id: string;
  defaults: IEnterpriseDefaults;
}

interface BalanceCounter {
  total: number;
  dots: any[];
}

export interface IBudgetPublicData {
  customCards?: { ['id']: ICustomBudgetCard };
  templates?: { ['id']: IBudget };
}

type month =
  | 'Jan'
  | 'Feb'
  | 'Mar'
  | 'Apr'
  | 'May'
  | 'Jun'
  | 'Jul'
  | 'Aug'
  | 'Sep'
  | 'Oct'
  | 'Nov'
  | 'Dec';

type week =
  | 'Week 1'
  | 'Week 2'
  | 'Week 3'
  | 'Week 4'
  | 'Week 5'
  | 'Week 6'
  | 'Week 7'
  | 'Week 8'
  | 'Week 9'
  | 'Week 10'
  | 'Week 11'
  | 'Week 12';

export const BUDGET_PERIOD_ROWS: { key: IBudgetPeriodType; label: string }[] = [
  { key: 'activities', label: 'Activities' },
  { key: 'inputs', label: 'Inputs' },
  { key: 'familyLabour', label: 'Family Labour' },
  { key: 'outputs', label: 'Outputs' },
  { key: 'produceConsumed', label: 'Produce Consumed' }
];
