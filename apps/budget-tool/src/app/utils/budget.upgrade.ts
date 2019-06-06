import { IBudget } from "../models/budget-tool.models";

/*  this file contains methods to make incremental changes to budgets 
    to upgrade for api changes
*/
export const BUDGET_API_VERSION = 3;

// recursively go through budget and if api version less than current perform incremental upgrade
export const checkForBudgetUpgrades = (budget: IBudget) => {
  console.log("checking for upgrade", budget.apiVersion, this.apiVersion);
  if (budget.apiVersion < this.apiVersion) {
    budget = upgradeBudget(budget);
    return this.checkForBudgetUpgrades(budget);
  } else {
    console.log("budget up to date");
    return budget;
  }
};

export const upgradeBudget = (budget: IBudget) => {
  const version = budget.apiVersion;
  console.log(`upgrading budget from v${version}`);
  switch (version) {
    case 1:
      return v1Upgrade(budget);
    case 2:
      return v2Upgrade(budget);
    default:
      throw new Error(`could not upgrade budget: ${JSON.stringify(budget)}`);
  }
};

// Legacy upgrade, not expected to find any budgets in this format and upgrade method not known
// as budget type might have changed need to also type as any
const v1Upgrade = (budget: IBudget | any) => {
  try {
  } catch (error) {
    budget.apiVersion = -1;
  }
  return budget;
};

// 15/10/2018
// recast budget period data period from string to number and capitlise scale
const v2Upgrade = (budget: IBudget | any) => {
  try {
    if (budget.periods && budget.periods.total) {
      budget.periods.total = Number(budget.periods.total);
      const lowerScale: string = budget.periods.scale;
      const upperSacle: string =
        lowerScale.charAt(0).toUpperCase() + lowerScale.substring(1);
      budget.periods.scale = upperSacle;
    }
    budget.apiVersion = 3;
    console.log("v2 upgrade successful");
  } catch (error) {
    budget.apiVersion = -1;
  }
  return budget;
};
