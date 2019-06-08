import { BUDGET_API_VERSION } from '../utils/budget.upgrade';
import REGIONAL_SETTINGS from '@picsa/core/environments/region';
import { IBudget, IBudgetPeriodMeta } from '../models/budget-tool.models';

const BUDGET_PERIOD_DEFAULT: IBudgetPeriodMeta = {
  starting: 10,
  scale: 'months',
  total: 6,
  labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']
};

export const NEW_BUDGET_TEMPLATE: IBudget = {
  apiVersion: BUDGET_API_VERSION,
  archived: false,
  created: new Date().toISOString(),
  data: {},
  description: null,
  enterprise: null,
  _key: null,
  periods: BUDGET_PERIOD_DEFAULT,
  title: null,
  enterpriseType: null,
  dotValues: REGIONAL_SETTINGS.currencyCounters
};

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
