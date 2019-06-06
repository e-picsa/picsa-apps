import { Action } from 'redux';
import { StandardAction, ClimateToolActions } from '../actions';
import { INITIAL_STATE, ClimateToolState } from '../../models';

export function ClimateToolReducer(
  state: ClimateToolState = INITIAL_STATE.climate,
  action: Action
) {
  switch (action.type) {
    case ClimateToolActions.SELECT_SITE:
      const siteSelect = action as StandardAction;
      return Object.assign({}, state, { site: siteSelect.payload });

    case ClimateToolActions.UPDATE_SITE:
      const updateSiteAction = action as StandardAction;
      const updatedSite = { ...state.site, ...updateSiteAction.payload };
      return Object.assign({}, state, { site: updatedSite });

    case ClimateToolActions.SELECT_CHART:
      const chartSelect = action as StandardAction;
      return Object.assign({}, state, { chart: chartSelect.payload });

    case ClimateToolActions.RESET_STATE:
      return INITIAL_STATE.climate;

    default:
      return state;
  }
}
