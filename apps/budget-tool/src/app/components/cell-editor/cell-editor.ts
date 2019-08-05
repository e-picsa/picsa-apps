import { Component, Input } from '@angular/core';
import { BudgetStore } from '../../store/budget.store';
import { ENVIRONMENT } from '@picsa/environments';
import {
  IBudgetActiveCell,
  IBudgetCard
} from '../../models/budget-tool.models';
import { PicsaDbService } from '@picsa/services/core';
import { FadeInOut } from '@picsa/animations';

@Component({
  selector: 'budget-cell-editor',
  templateUrl: './cell-editor.html',
  styleUrls: ['./cell-editor.scss'],
  animations: [FadeInOut()]
})

/*  The budget cell editor sits on top of the budget table, so that when opened covers the table
 */
export class BudgetCellEditorComponent {
  @Input() cell: IBudgetActiveCell;
  isOpen = false;
  currency = ENVIRONMENT.region.currency;
  allBudgetCards: IBudgetCard[];
  constructor(private store: BudgetStore, private db: PicsaDbService) {
    console.log('budget cell editor');
  }

  onCardClicked(card: IBudgetCard) {
    console.log('card clicked', card);
  }

  cellChanged(cell: IBudgetActiveCell) {}

  saveCell() {
    console.log('TODO - saving cell');
    // TODO
    this.store.toggleEditor();
  }
}
