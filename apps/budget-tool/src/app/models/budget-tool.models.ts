export interface BudgetToolState {
  active: IBudget;
  meta: IBudgetMeta;
  view?: IBudgetView;
  // no additional parameters currently specified (may change)
}

export interface IBudget {
  _key: string;
  title: string;
  archived: boolean;
  periods: IPeriods;
  description: string;
  enterprise: string;
  enterpriseType: string;
  scale: 'Days' | 'Months' | 'Weeks';
  dotValues: IBudgetDotValues;
  created: string;
  data: { [index: string]: IBudgetPeriodData };
  apiVersion: number;
}

export interface IBudgetMeta {
  activities: IBudgetCard[];
  enterpriseTypes: IEnterpriseType[];
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
  // balance?: IBudgetBalance;
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

interface IPeriods {
  labels: string[];
  starting: string;
  scale: string;
  // v1-2 cast string, v3 upgrade to number
  total: string | number;
}

// cards contain additional grouping (e.g. enterprise type) along with isSelected and selectedIndex populated when
// attached to budget data
export interface IBudgetCard {
  name: string;
  id: string;
  type?: IEnterpriseType;
  isSelected?: boolean;
  selectedIndex?: number;
  quantity?: number;
  consumed?: number;
  cost?: number;
}
export type IEnterpriseType = 'crop' | 'fish' | 'fruits' | 'livestock';

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
}

interface FamilyLabourCard {
  people: number;
  days: number;
}

interface BalanceCounter {
  total: number;
  dots: any[];
}

interface IBudgetBalance {
  inputs: BalanceCounter;
  outputs: BalanceCounter;
  consumed: BalanceCounter;
  monthly: BalanceCounter;
  running: BalanceCounter;
}

export interface IBudgetPublicData {
  customCards?: { ['id']: ICustomBudgetCard };
  templates?: { ['id']: IBudget };
}
