import { Component, Input, ViewChild } from '@angular/core';
import { BudgetStore } from '../../store/budget.store';
import { ENVIRONMENT } from '@picsa/environments';
import {
  IBudgetActiveCell,
  IBudgetCard
} from '../../models/budget-tool.models';
import { FadeInOut } from '@picsa/animations';
import { MatStepper } from '@angular/material';

@Component({
  selector: 'budget-cell-editor',
  templateUrl: './cell-editor.html',
  styleUrls: ['./cell-editor.scss'],
  animations: [FadeInOut({ inSpeed: 200, inDelay: 500 })]
})

/*  The budget cell editor sits on top of the budget table, so that when opened covers the table
 */
export class BudgetCellEditorComponent {
  @Input() cell: IBudgetActiveCell;
  isOpen = false;
  currency = ENVIRONMENT.region.currency;
  allBudgetCards: IBudgetCard[];
  selected: { [id: string]: boolean } = {};
  selectedArray: IBudgetCard[] = [];
  @ViewChild('stepper', { static: true }) stepper: MatStepper;
  constructor(private store: BudgetStore) {
    console.log('budget cell editor');
  }

  // on click toggle keys on the selected cards property, saving full card data for use later
  onCardClicked(card: IBudgetCard) {
    this.selected[card._key] = !this.selected[card._key];
    // check if card with key already exists in array, if yes remove, if no push
    const arrIndex = this.selectedArray.map(el => el._key).indexOf(card._key);
    if (arrIndex > -1) {
      this.selectedArray.splice(arrIndex, 1);
    } else {
      this.selectedArray.push(card);
    }
  }
  onNextClicked() {
    if (this.stepper.selectedIndex < 1) {
      return this.stepper.next();
    }
  }

  cellChanged(cell: IBudgetActiveCell) {}

  saveCell() {
    console.log('TODO - saving cell');
    // TODO
    this.store.toggleEditor();
  }
}
