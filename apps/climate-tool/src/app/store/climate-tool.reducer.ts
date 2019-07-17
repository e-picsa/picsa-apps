// import { Action } from "redux";
// import { StandardAction } from "../../actions/actions";
// import { INITIAL_STATE } from "src/app/store/store.model";
// import { ClimateToolActions } from "./climate-tool.actions";
// import { ClimateToolState } from '@picsa/core/models/climate.models';

// export function ClimateToolReducer(
//   state: ClimateToolState = INITIAL_STATE.climate,
//   action: Action
// ) {
//   switch (action.type) {
//     case ClimateToolActions.SELECT_SITE:
//       const siteSelect = action as StandardAction;
//       return Object.assign({}, state, { site: siteSelect.payload });

//     case ClimateToolActions.UPDATE_SITE:
//       const updateSiteAction = action as StandardAction;
//       const updatedSite = { ...state.site, ...updateSiteAction.payload };
//       return Object.assign({}, state, { site: updatedSite });

//     case ClimateToolActions.SELECT_CHART:
//       const chartSelect = action as StandardAction;
//       return Object.assign({}, state, { chart: chartSelect.payload });

//     case ClimateToolActions.RESET_STATE:
//       return INITIAL_STATE.climate;

//     default:
//       return state;
//   }
// }
