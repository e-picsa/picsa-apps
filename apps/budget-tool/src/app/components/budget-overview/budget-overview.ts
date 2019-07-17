import { NgRedux, select } from '@angular-redux/store';
import { Component, OnDestroy } from '@angular/core';
import { Events } from '@ionic/angular';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { debounceTime } from 'rxjs/operators';
import { AppState } from '@picsa/models';
import {
  IBudget,
  IBudgetCard,
  IBudgetDotValues,
  IBudgetPeriodData
} from '../../models/budget-tool.models';

@Component({
  selector: 'budget-overview',
  templateUrl: 'budget-overview.html'
})
export class BudgetOverviewComponent implements OnDestroy {
  private componentDestroyed: Subject<any> = new Subject();
  @select(['budget', 'active'])
  budget$: Observable<IBudget>;
  @select(['budget', 'active', 'dotValues'])
  dotValues$: Observable<IBudgetDotValues>;
  budget: IBudget;
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

  constructor(public events: Events, private ngRedux: NgRedux<AppState>) {
    // on changes refresh whole budget
    // *** inefficient but otherwise difficult to get bindings triggering correctly
    // tried cdr and application ref but neither seemed to work. Also tried listening
    // on child components but again was tempermental
    this.budget$
      .pipe(debounceTime(250))
      .pipe(takeUntil(this.componentDestroyed))
      .subscribe(budget => {
        console.log('budget updated');
        this.budgetUpdated = false;
        this.budget = budget;
        setTimeout(() => {
          this.budgetUpdated = true;
        }, 50);
      });
    this.dotValues$
      .pipe(takeUntil(this.componentDestroyed))
      .subscribe(values => {
        if (values) {
          this.dotsLegend = this._objectToArray(values);
        }
      });
    this.events.subscribe('calculate:budget', () => {
      this.calculateBalance();
    });
  }
  ngOnDestroy() {
    this.componentDestroyed.next();
    this.componentDestroyed.unsubscribe();
  }
  _objectToArray(json) {
    const array = [];
    for (const key in json) {
      if (json.hasOwnProperty(key)) {
        array.push({ key: key, value: json[key] });
      }
    }
    return array;
  }

  getIndex(array, card) {
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

  calculateBalance() {
    // total for current period
    // const data = this.store.activeBudget.data;
    // const totals = {};
    // let runningTotal = 0;
    // for (const key in data) {
    //   if (data.hasOwnProperty(key)) {
    //     const periodTotal = this._calculatePeriodTotal(data[key]);
    //     runningTotal = runningTotal + periodTotal;
    //     totals[key] = {
    //       period: periodTotal,
    //       running: runningTotal
    //     };
    //   }
    // }
    // this.balance = totals;
  }
  _calculatePeriodTotal(period: IBudgetPeriodData) {
    let balance = 0;
    if (period) {
      const inputCards = _jsonObjectValues(period.inputs);
      const inputsBalance = this._calculatePeriodCardTotals(inputCards);
      const outputCards = _jsonObjectValues(period.outputs);
      const outputsBalance = this._calculatePeriodCardTotals(outputCards);
      balance = inputsBalance + outputsBalance;
    }
    return balance;
  }
  _calculatePeriodCardTotals(cards: IBudgetCard[]) {
    let total = 0;
    if (cards && cards.length > 0) {
      cards.forEach(card => {
        if (card.quantity && card.cost) {
          const quantity = card.consumed
            ? card.quantity - card.consumed
            : card.quantity;
          total = total + quantity * card.cost;
        }
      });
    }
    return total;
  }
}
function _jsonObjectValues(json: any) {
  const values = [];
  for (const key in json) {
    if (json.hasOwnProperty(key)) {
      values.push(json[key]);
    }
  }
  return values;
}
