import { Component, Input } from '@angular/core';
import { BudgetStore } from '../../store/budget.store';
import { ENVIRONMENT } from '@picsa/environments';
import {
  IBudgetActiveCell,
  IBudgetCard
} from '../../models/budget-tool.models';
import { PicsaDbService } from '@picsa/services/core';

@Component({
  selector: 'budget-cell-editor',
  templateUrl: './cell-editor.html',
  styleUrls: ['./cell-editor.scss']
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

  ngOnInit() {
    this.loadCards();
  }
  async loadCards() {
    const cards = await this.db.getCollection('budgetTool/_all/cards');
  }

  cellChanged(cell: IBudgetActiveCell) {}

  saveCell() {
    console.log('TODO - saving cell');
    // TODO
    this.store.toggleEditor();
  }
}
