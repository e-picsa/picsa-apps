import { Component, Input, ViewChild } from '@angular/core';
import { BudgetStore } from '../../store/budget.store';
import {
  IBudgetActiveCell,
  IBudgetCard,
  IBudgetCardWithValues,
  IBudgetCardValues
} from '../../models/budget-tool.models';
import { FadeInOut } from '@picsa/animations';
import { MatStepper } from '@angular/material';

@Component({
  selector: 'budget-cell-editor',
  templateUrl: './cell-editor.html',
  styleUrls: ['./cell-editor.scss'],
  animations: [
    FadeInOut({ inSpeed: 200, inDelay: 500, outSpeed: 100, outDelay: 0 })
  ]
})

/*  The budget cell editor sits on top of the budget table, so that when opened covers the table
 */
export class BudgetCellEditorComponent {
  _cell: IBudgetActiveCell;
  allBudgetCards: IBudgetCard[];
  selected: { [id: string]: boolean } = {};
  selectedArray: IBudgetCardWithValues[] = [];
  stepsShown = {};
  showAllCards = false;
  @Input() set cell(cell: IBudgetActiveCell) {
    this.resetView();
    this.setSteps(cell);
    this.setValues(cell);
    this._cell = cell;
  }
  @ViewChild('stepper', { static: true }) stepper: MatStepper;
  constructor(private store: BudgetStore) {}

  setValues(cell: IBudgetActiveCell) {
    // family labour handled directly, otherwise iterate over objects
    if (cell.typeKey !== 'familyLabour') {
      const selected = {};
      cell.cellData.forEach(card => (selected[card.id] = true));
      this.selected = selected;
      this.selectedArray = [...cell.cellData];
    }
  }

  resetView() {
    this.showAllCards = false;
    if (this.stepper && this.stepper.selectedIndex > 0) {
      this.stepper.reset();
    }
  }

  setSteps(cell: IBudgetActiveCell) {
    const type = cell.typeKey;
    this.stepsShown = {
      cardStep: type !== 'familyLabour',
      valueStep: ['inputs', 'outputs'].includes(type),
      labourStep: type === 'familyLabour',
      consumedStep: type === 'produceConsumed'
    };
  }

  // on click toggle keys on the selected cards property, saving full card data for use later
  onCardClicked(card: IBudgetCard) {
    this.selected[card.id] = !this.selected[card.id];
    // check if card with key already exists in array, if yes remove, if no push
    const arrIndex = this.selectedArray.map(el => el.id).indexOf(card.id);
    if (arrIndex > -1) {
      this.selectedArray.splice(arrIndex, 1);
    } else {
      const defaultValues = { cost: null, quantity: null, total: null };
      this.selectedArray.push({ ...card, values: defaultValues });
    }
  }
  onNextClicked() {
    if (this.stepper.selectedIndex < this.stepper.steps.length - 1) {
      this.stepper.next();
    } else {
      this.saveCell();
      this.store.toggleEditor();
    }
  }

  // using manual bindings instead of ngmodel as nested ngfor-ngmodel with matInput tricky
  onCardValueChange(values: IBudgetCardValues, index: number) {
    this.selectedArray[index].values = values;
  }
  onFamilyLabourChange(values: IBudgetCardWithValues[]) {
    this.selectedArray = values;
  }

  saveCell() {
    this.store.saveEditor(this.selectedArray);
  }

  // use trackby on inputs as otherwise each one changing would re-render all others
  // (updating any input re-renders all others)
  trackByIndex(index: number, obj: any): any {
    return index;
  }
}
