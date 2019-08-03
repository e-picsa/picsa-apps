import { Injectable } from '@angular/core';
import {
  IBudgetDotValues,
  ICustomBudgetCard
} from '../models/budget-tool.models';

@Injectable({ providedIn: 'root' })
export class BudgetToolProvider {
  dotValues: IBudgetDotValues;
  constructor() {
    this.init();
  }

  // automatically populate data from storage
  // if first load, populate storage with hardcoded data
  async init() {
    // const budgetData = await this.storagePrvdr.storage.get('_budgetMeta');
    // if (!budgetData) {
    //   await this.storagePrvdr.storage.set('_budgetMeta', BUDGET_DATA);
    //   this.init();
    // } else {
    //   console.log('setting budget meta', BUDGET_DATA);
    //   this.actions.setBudgetMeta(BUDGET_DATA);
    // }
  }

  _sortData(collection: ICustomBudgetCard[]) {
    try {
      // want to first sort alphabetically
      collection = collection.sort((a, b) => {
        return a.name > b.name ? 1 : -1;
      });
      // then demote cards which are 'custom:true'
      collection = collection.sort((a, b) => {
        return !a.custom ? -1 : !b.custom ? 1 : -1;
      });
      return collection;
    } catch (error) {
      return collection;
    }
  }
}
