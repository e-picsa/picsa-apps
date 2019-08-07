import { Component, Input, ViewChild } from '@angular/core';
import { BudgetStore } from '../../store/budget.store';
import { ENVIRONMENT } from '@picsa/environments';
import {
  IBudgetActiveCell,
  IBudgetCard,
  IBudgetPeriodData
} from '../../models/budget-tool.models';
import { FadeInOut } from '@picsa/animations';
import { MatStepper } from '@angular/material';
import { toJS } from 'mobx';

@Component({
  selector: 'budget-cell-editor',
  templateUrl: './cell-editor.html',
  styleUrls: ['./cell-editor.scss'],
  animations: [FadeInOut({ inSpeed: 200, inDelay: 500 })]
})

/*  The budget cell editor sits on top of the budget table, so that when opened covers the table
 */
export class BudgetCellEditorComponent {
  _cell: IBudgetActiveCell;
  currency = ENVIRONMENT.region.currency;
  allBudgetCards: IBudgetCard[];
  selected: { [id: string]: boolean } = {};
  selectedArray: IBudgetCard[] = [];
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
    cell.cellData.forEach(card => (this.selected[card.id] = true));
    this.selectedArray = cell.cellData;
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
      valueStep: ['inputs', 'outputs', 'produceConsumed'].includes(type),
      labourStep: type === 'familyLabour'
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
      this.selectedArray.push(toJS(card));
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

  saveCell() {
    this.store.saveEditor(this.selectedArray);
  }
}
