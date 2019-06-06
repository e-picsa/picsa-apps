import { dispatch } from "@angular-redux/store";
import { Injectable } from "@angular/core";
import { FluxStandardAction } from "flux-standard-action";
import { IBudget, IBudgetView } from "../models/budget-tool.models";

type StandardAction = FluxStandardAction<string, IBudget | IBudgetView>;

@Injectable({ providedIn: "root" })
export class BudgetToolActions {
  static readonly SET_ACTIVE_BUDGET = "SET_ACTIVE_BUDGET";
  static readonly SET_BUDGET_META = "SET_BUDGET_META";
  static readonly PATCH_BUDGET_META = "PATCH_BUDGET_META";
  static readonly SET_BUDGET_VIEW = "SET_BUDGET_VIEW";

  @dispatch()
  setActiveBudget = (budget: IBudget): StandardAction => ({
    type: BudgetToolActions.SET_ACTIVE_BUDGET,
    payload: budget,
    meta: null
  });

  // set the value of specific meta fields (multiple)
  @dispatch()
  setBudgetMeta = (meta: any): StandardAction => ({
    type: BudgetToolActions.SET_BUDGET_META,
    meta: null,
    payload: meta
  });

  // patch a single meta value to combine existing with new fields
  // used to update hardcoded meta with custom
  @dispatch()
  patchBudgetMeta = (meta: any): StandardAction => ({
    type: BudgetToolActions.PATCH_BUDGET_META,
    meta: null,
    payload: meta
  });

  @dispatch()
  setBudgetView = (view: IBudgetView): StandardAction => ({
    type: BudgetToolActions.SET_BUDGET_VIEW,
    meta: null,
    payload: view
  });
}
