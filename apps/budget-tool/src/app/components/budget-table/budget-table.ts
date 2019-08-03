import { NgRedux, select } from '@angular-redux/store';
import { Component, OnDestroy, Input } from '@angular/core';
import { Events } from '@ionic/angular';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { debounceTime } from 'rxjs/operators';
import {
  IBudget,
  IBudgetCard,
  IBudgetDotValues,
  IBudgetPeriodData
} from '../../models/budget-tool.models';

@Component({
  selector: 'budget-table',
  templateUrl: 'budget-table.html'
})
export class BudgetTableComponent implements OnDestroy {
  private componentDestroyed: Subject<any> = new Subject();
  @Input() budget: IBudget;
  // @select(['budget', 'active', 'dotValues'])
  // dotValues$: Observable<IBudgetDotValues>;
  // budget: IBudget;
  rowTitles: any = [
    { type: 'activities', label: 'Activities' },
    { type: 'inputs', label: 'Inputs' },
    { type: 'familyLabour', label: 'Family Labour' },
    { type: 'outputs', label: 'Outputs' },
    { type: 'produceConsumed', label: 'Produce Consumed' },
    { type: 'cashBalance', label: 'Balance' }
  ];
  dotsLegend = [];
  balance: any;
  budgetUpdated = true;

  constructor(public events: Events) {
    // this.dotValues$
    //   .pipe(takeUntil(this.componentDestroyed))
    //   .subscribe(values => {
    //     if (values) {
    //       this.dotsLegend = this._objectToArray(values);
    //     }
    //   });
    // this.events.subscribe('calculate:budget', () => {
    //   this.calculateBalance();
    // });
  }
  ngOnDestroy() {
    this.componentDestroyed.next();
    this.componentDestroyed.unsubscribe();
  }
  private _objectToArray(json) {
    const array = [];
    for (const key in json) {
      if (json.hasOwnProperty(key)) {
        array.push({ key: key, value: json[key] });
      }
    }
    return array;
  }

  private getIndex(array, card) {
    let index = -1;
    let i = 0;
    for (const item of array) {
      if (item.ID === card.ID) {
        index = i;
      }
      i++;
    }
    return index;
  }
}
