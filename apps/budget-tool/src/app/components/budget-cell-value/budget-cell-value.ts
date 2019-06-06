import { select } from "@angular-redux/store";
import { Component, Input, OnDestroy } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { takeUntil } from "rxjs/operators";
import { IBudgetDotValues } from "../../models/budget-tool.models";

@Component({
  selector: "budget-cell-value",
  templateUrl: "budget-cell-value.html"
})
export class BudgetCellValueComponent implements OnDestroy {
  private componentDestroyed: Subject<any> = new Subject();
  @Input()
  set quantity(quantity: number) {
    this._quantity = quantity;
    this.generateRepresentation();
  }
  @Input()
  set cost(cost: number) {
    this._cost = cost;
    this.generateRepresentation();
  }
  @Input()
  set consumed(consumed: number) {
    this._consumed = consumed;
    this.generateRepresentation();
  }
  @select(["budget", "active", "dotValues"])
  dotValues$: Observable<IBudgetDotValues>;
  _quantity: number;
  _cost: number;
  _consumed: number;
  dotValues: IBudgetDotValues;
  dotsArray: number[];
  dotValueAllocation: any = baseAllocation;

  constructor() {
    this._addSubscribers();
  }
  ngOnDestroy() {
    this.componentDestroyed.next();
    this.componentDestroyed.unsubscribe();
  }

  // given updates to cost or quantity split the total into components of the large, medium, small and half values
  // map these values to directed arrays to populate images in the pictorial representation
  generateRepresentation() {
    if (this._cost && this._quantity) {
      const quantity = this._consumed
        ? this._quantity - this._consumed
        : this._quantity;
      const total = this._cost * quantity;
      const sign = total >= 0 ? "positive" : "negative";
      let toAllocate = Math.abs(total);
      // keep track of how many times each value is multiplied by to make total
      const dotAllocation = Object.assign({}, this.dotValues);
      // iterate over values, subtracting multiples of divisor
      for (const dotType in this.dotValues) {
        if (this.dotValues.hasOwnProperty(dotType)) {
          const divisor = this.dotValues[dotType];
          const multiples = Math.floor(toAllocate / divisor);
          toAllocate = toAllocate - divisor * multiples;
          dotAllocation[dotType] = this._createArray(multiples, sign);
        }
      }
      this.dotValueAllocation = dotAllocation;
    } else {
      this.dotValueAllocation = baseAllocation;
    }
  }
  _createArray(length: number, sign: "positive" | "negative") {
    return new Array(length).fill(sign);
  }

  _addSubscribers() {
    this.dotValues$
      .pipe(takeUntil(this.componentDestroyed))
      .subscribe(values => {
        if (values) {
          this.dotValues = values;
          this.generateRepresentation();
        }
      });
  }
}

const baseAllocation = {
  large: [],
  medium: [],
  small: [],
  half: []
};
