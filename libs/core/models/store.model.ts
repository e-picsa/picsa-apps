import { IUser, IData } from './models';
import { BudgetToolState, ClimateToolState } from '@picsa/core/models';

export const INITIAL_STATE: AppState = {
  user: null,
  climate: null,
  budget: {
    active: null,
    meta: null
  },
  data: null,
  platform: null,
  router: null
};

export interface AppState {
  user: IUser;
  climate: ClimateToolState;
  budget: BudgetToolState;
  data: IData;
  platform: {
    error: string;
  };
  router: any;
}
