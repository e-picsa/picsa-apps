import { IUser, IData } from './models';
// import { ClimateToolState } from "src/tools/climate-tool/climate-tool.models";
// import { BudgetToolState } from "src/tools/budget-tool/models/budget-tool.models";

// *** TODO - decide strategy for cross models (fix AppState)

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
  climate: any;
  budget: any;
  data: IData;
  platform: {
    error: string;
  };
  router: any;
}
