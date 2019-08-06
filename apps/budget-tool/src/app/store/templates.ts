import { BUDGET_API_VERSION } from '../utils/budget.upgrade';
import {
  // IBudgetPeriodMeta,
  IBudget,
  IBudgetPeriodData,
  IBudgetPeriodType
} from '../models/budget-tool.models';
import { generateDBMeta } from '@picsa/services/core';

export const PERIOD_DATA_TEMPLATE: IBudgetPeriodData = {
  activities: [],
  inputs: [],
  outputs: [],
  familyLabour: {},
  produceConsumed: {}
};

// don't assert type so missing _key field picked up in create new budget from store
export const NEW_BUDGET_TEMPLATE: IBudget = {
  apiVersion: BUDGET_API_VERSION,
  data: [],
  meta: {
    title: null,
    description: null,
    enterprise: {
      id: null,
      name: null,
      type: null
    },
    lengthScale: 'months',
    lengthTotal: 5,
    monthStart: 9,
    valueScale: 1
  },
  ...generateDBMeta()
};

export const BUDGET_PERIOD_ROWS: { key: IBudgetPeriodType; label: string }[] = [
  { key: 'activities', label: 'Activities' },
  { key: 'inputs', label: 'Inputs' },
  { key: 'familyLabour', label: 'Family Labour' },
  { key: 'outputs', label: 'Outputs' },
  { key: 'produceConsumed', label: 'Produce Consumed' }
];

// take an array [a,b,c,d] and cycle by offset (e.g. 1=> [b,c,d,a])
function _arrayOffset(arr: any[], offset: number, totalLength?: number) {
  const offArr = [];
  arr.forEach((v, i) => {
    offArr[(i + (arr.length - offset)) % arr.length] = v;
  });
  console.log('offArr', offArr);
  const trimEnd = totalLength ? totalLength : arr.length - 1;
  console.log('sliced', offArr.slice(0, trimEnd));
  return offArr.slice(0, trimEnd);
}

export const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
];
