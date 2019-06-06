import { Component, Input } from "@angular/core";
import { BudgetToolProvider } from "../../store/budget-tool.provider";

@Component({
  selector: "budget-cell-labour",
  templateUrl: "budget-cell-labour.html"
})
export class BudgetCellLabourComponent {
  @Input()
  set days(days: number) {
    this._days = days;
    this.generateRepresentation();
  }
  @Input()
  set people(people: number) {
    this._people = people;
    this.generateRepresentation();
  }
  _days: number;
  _people: number;
  daysArray: number[][];

  constructor(private budgetPrvdr: BudgetToolProvider) {}

  // given updates to people or days split the total into components of the large, medium, small and half values
  // map these values to directed arrays to populate images in the pictorial representation
  generateRepresentation() {
    const daysArray = [];
    if (this._people && this._days) {
      for (let i = 0; i < this._days; i++) {
        daysArray.push(this._createArray(this._people, 1));
      }
    }
    console.log("daysArray", daysArray);
    this.daysArray = daysArray;
  }
  _createArray(length: number, value: any) {
    return new Array(length).fill(value);
  }
}

const baseAllocation = {
  days: [],
  people: []
};
