import { combineReducers, Reducer } from 'redux';
import { routerReducer } from '@angular-redux/router';
import { UserReducer } from './user.reducer';
import { DataReducer } from './data.reducer';
import { PlatformReducer } from './platform.reducer';

import { AppState } from '../../../models';

export const rootReducer: Reducer<AppState> = combineReducers({
  user: UserReducer,
  data: DataReducer,
  platform: PlatformReducer,
  router: routerReducer
});
