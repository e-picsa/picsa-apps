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
    console.log('value set', value);
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
      let allocation = [];
      // keep track of how many times each value is multiplied by to make total
      let toAllocate = Math.abs(val);
      divisors.forEach((divisor, i) => {
        const multiples = Math.floor(toAllocate / divisor);
        toAllocate = toAllocate - divisor * multiples;
        allocation = allocation.concat(
          new Array(multiples).fill({
            value: divisor,
            img: `dot-${labels[i]}`,
            isNegative: val < 0
          })
        );
      });
      this.counterAllocation = allocation;
    }
  }
}
type ICounterAllocation = {
  value: number;
  img: string;
  isNegative: boolean;
};
