import { Injectable } from '@angular/core';
import { ICustomBudgetCard } from '../models/budget-tool.models';

@Injectable({ providedIn: 'root' })
export class BudgetToolProvider {
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
