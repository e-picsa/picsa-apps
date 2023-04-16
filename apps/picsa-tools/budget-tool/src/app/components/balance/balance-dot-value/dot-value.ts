import { Component, Input } from '@angular/core';

import { IBudgetValueCounters } from '../../../models/budget-tool.models';
import {
  BudgetStore,
  IBudgetCounterSVGIcons,
} from '../../../store/budget.store';

@Component({
  selector: 'budget-balance-dot-value',
  templateUrl: './dot-value.html',
  styleUrls: ['./dot-value.scss'],
})
export class BudgetBalanceDotValueComponent {
  public svgIcons: IBudgetCounterSVGIcons;
  constructor(private store: BudgetStore) {
    this.svgIcons = this.store.counterSVGIcons;
  }
  _value = 0;
  _valueCounters: IBudgetValueCounters;
  // counter allocation keeps track of both labels and values that
  // make up a value, e.g. 1050 = [[large,500],[large,500],[small,50]]
  counterAllocation: ICounterAllocation[];
  @Input()
  set value(value: number) {
    this._value = value;
    this.generateRepresentation();
  }
  @Input()
  set valueCounters(counters: IBudgetValueCounters) {
    this._valueCounters = counters;
    this.generateRepresentation();
  }

  generateRepresentation() {
    if (this._value && this._valueCounters) {
      const labels = this._valueCounters[0];
      const divisors = this._valueCounters[1];
      const val = this._value;
      let allocation: ICounterAllocation[] = [];
      // keep track of how many times each value is multiplied by to make total
      // TODO - rendering would be more efficient if a single svg rendered, and <use> tag to re-use paths
      // instead of rendering multiple svgs (would need to handle overflow/scroll however)
      let toAllocate = Math.abs(val);
      divisors.forEach((divisor, i) => {
        const multiples = Math.floor(toAllocate / divisor);
        toAllocate = toAllocate - divisor * multiples;
        allocation = allocation.concat(
          new Array(multiples).fill({
            value: divisor,
            icon: labels[i],
            isNegative: val < 0,
          })
        );
      });
      // Avoid rendering very large number of counters
      // TODO - show value instead
      if (allocation.length > 20) {
        this.counterAllocation = [];
      } else {
        this.counterAllocation = allocation;
      }
    }
  }
}
type ICounterAllocation = {
  value: number;
  isNegative: boolean;
  icon: string;
};
