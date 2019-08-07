import { Component, OnInit, Input } from '@angular/core';
import { IBudgetValueCounters } from '../../../models/budget-tool.models';

@Component({
  selector: 'budget-balance-dot-value',
  templateUrl: './dot-value.html',
  styleUrls: ['./dot-value.scss']
})
export class BudgetBalanceDotValueComponent implements OnInit {
  constructor() {}
  _value: number = 0;
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

  ngOnInit() {}

  generateRepresentation() {
    if (this._value && this._valueCounters) {
      const labels = this._valueCounters[0];
      const divisors = this._valueCounters[1];
      const val = this._value;
      const sign = val >= 0 ? 'positive' : 'negative';
      let allocation = [];
      // keep track of how many times each value is multiplied by to make total
      let toAllocate = Math.abs(val);
      divisors.forEach((divisor, i) => {
        const multiples = Math.floor(toAllocate / divisor);
        toAllocate = toAllocate - divisor * multiples;
        allocation = allocation.concat(
          new Array(multiples).fill({
            value: divisor,
            img: `dot-${labels[i]}-${sign}`,
            color: sign
          })
        );
      });
      this.counterAllocation = allocation;
      console.log('value', val, allocation.map(a => a.value));
    }
  }
}
type ICounterAllocation = {
  value: number;
  img: string;
  color: 'positive' | 'negative';
};
