import { APP_VERSION } from '@picsa/environments';
import { generateDBMeta } from '@picsa/shared/services/core/db';

import {
  // IBudgetPeriodMeta,
  IBudget,
  IBudgetPeriodData,
  IBudgetPeriodType,
} from '../models/budget-tool.models';
import { BUDGET_API_VERSION } from '../utils/budget.upgrade';

export const PERIOD_DATA_TEMPLATE: IBudgetPeriodData = {
  activities: [],
  inputs: [],
  outputs: [],
  familyLabour: [],
  produceConsumed: [],
};

// don't assert type so missing _key field picked up in create new budget from store
export const NEW_BUDGET_TEMPLATE: IBudget = {
  apiVersion: BUDGET_API_VERSION,
  _appVersion: APP_VERSION.number,
  data: [],
  meta: {
    title: '',
    description: '',
    enterprise: {
      id: '',
      label: '',
      type: null as any,
      groupings: [],
    },
    lengthScale: 'months',
    lengthTotal: 5,
    monthStart: 9,
    valueScale: 1,
  },
  ...generateDBMeta(),
};

export const BUDGET_DOT_VALUES = {};

export const BUDGET_PERIOD_ROWS: { [key in IBudgetPeriodType]: string } = {
  activities: 'Activities',
  inputs: 'Inputs',
  familyLabour: 'Family Labour',
  outputs: 'Outputs',
  produceConsumed: 'Produce Consumed',
};

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
