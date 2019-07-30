import { Action } from 'redux';
import { FluxStandardAction } from 'flux-standard-action';
import { BudgetToolActions } from './budget-tool.actions';
import { IBudgetCard } from '../models/budget-tool.models';
type StandardAction = FluxStandardAction<any, any>;

export function BudgetToolReducer(state: any = {}, action: Action) {
  switch (action.type) {
    case BudgetToolActions.SET_ACTIVE_BUDGET:
      const updatedBudget = action as StandardAction;
      // want to be able to set null to clear budget
      if (!updatedBudget.payload) {
        return { ...state, active: null };
      }
      const newBudget = { ...state.active, ...updatedBudget.payload };
      return { ...state, active: newBudget };

    case BudgetToolActions.SET_BUDGET_META:
      const budgetMeta = action as StandardAction;
      const newMeta = { ...state.meta, ...budgetMeta.payload };
      return { ...state, meta: newMeta };

    // merge arrays of existing and incoming meta, overwriting duplicates
    // e.g. hard-coded activities and custom cards
    case BudgetToolActions.PATCH_BUDGET_META:
      const budgetMetaPatch = action as StandardAction;
      const meta = { ...state.meta };
      Object.keys(budgetMetaPatch.payload).forEach(key => {
        meta[key] = _mergeBudgetCardsArrays(
          state.meta[key],
          budgetMetaPatch.payload[key]
        );
      });
      return { ...state, meta: meta };

    case BudgetToolActions.SET_BUDGET_VIEW:
      const budgetView = action as StandardAction;
      return { ...state, view: budgetView.payload };

    default:
      return state;
  }
}

//
function _mergeBudgetCardsArrays(arr1: IBudgetCard[], arr2: IBudgetCard[]) {
  const json = {};
  arr1.forEach(el => {
    json[el.id] = el;
  });
  arr2.forEach(el => {
    json[el.id] = el;
  });
  // convert json back to array
  const arr = [];
  Object.keys(json).forEach(key => {
    if (json.hasOwnProperty(key)) {
      arr.push(json[key]);
    }
  });
}
