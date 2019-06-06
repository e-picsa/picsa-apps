import { combineReducers, Reducer } from 'redux';
import { routerReducer } from '@angular-redux/router';
import { UserReducer } from './user.reducer';
import { BudgetToolReducer } from './budget-tool.reducer';
import { ClimateToolReducer } from './climate-tool.reducer';
import { DataReducer } from './data.reducer';
import { PlatformReducer } from './platform.reducer';

import { AppState } from '../../models';

export const rootReducer: Reducer<AppState> = combineReducers({
  user: UserReducer,
  // climate: ClimateToolReducer,
  // budget: BudgetToolReducer,
  data: DataReducer,
  platform: PlatformReducer,
  router: routerReducer
});
