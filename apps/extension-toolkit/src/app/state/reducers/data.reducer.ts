import { Action } from 'redux';
import { DataAction, DataActions } from '../actions/data.actions';
import { IData } from '../../models/models';
import { INITIAL_STATE } from '../../models/store.model';

export function DataReducer(state: IData = INITIAL_STATE.data, action: Action) {
  switch (action.type) {
    case DataActions.LOAD_DATA:
      const dataLoad = action as DataAction;
      return Object.assign({}, state, dataLoad.payload);

    case DataActions.SYNC_DATA:
      const dataSync = action as DataAction;
      return Object.assign({}, state, dataSync.payload);

    default:
      return state;
  }
}
