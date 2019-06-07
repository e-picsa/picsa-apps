import { BUDGET_API_VERSION } from '../utils/budget.upgrade';
import REGIONAL_SETTINGS from '@picsa/core/environments/region';
import { IBudget } from '../models/budget-tool.models';

const BUDGET_DEFAULT_SETTINGS = {
  periods: {
    days: {
      labels: ['Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat', 'Sun'],
      starting: 'Mon',
      scale: 'Days',
      total: 7
    }
  }
};

export const NEW_BUDGET_TEMPLATE: IBudget = {
  apiVersion: BUDGET_API_VERSION,
  archived: false,
  created: new Date().toISOString(),
  data: {},
  description: null,
  enterprise: null,
  _key: null,
  periods: BUDGET_DEFAULT_SETTINGS.periods.days,
  title: null,
  scale: null,
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

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thur', 'Fri', 'Sat', 'Sun'];
