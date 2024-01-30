import { marker as translateMarker } from '@biesbjerg/ngx-translate-extract-marker';
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
      imgType: 'svg',
    },
    lengthScale: 'months',
    lengthTotal: 5,
    monthStart: 9,
    valueScale: 1,
  },
  ...generateDBMeta(),
};

export const BUDGET_DOT_VALUES = {};

export interface IBudgetPeriodRow {
  type: IBudgetPeriodType;
  label: string;
  sublabel?: string;
}

export const BUDGET_PERIOD_ROWS: IBudgetPeriodRow[] = [
  { type: 'activities', label: translateMarker('Activities') },
  { type: 'inputs', label: translateMarker('Inputs'), sublabel: translateMarker('Purchased') },
  { type: 'familyLabour', label: translateMarker('Family Labour') },
  { type: 'outputs', label: translateMarker('Outputs'), sublabel: translateMarker('For Sale') },
  { type: 'produceConsumed', label: translateMarker('Produce Consumed') },
];
