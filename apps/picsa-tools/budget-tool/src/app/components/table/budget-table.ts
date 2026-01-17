import { Component, inject,Input, output } from '@angular/core';

import { IBudget, IBudgetPeriodType } from '../../models/budget-tool.models';
import { BudgetService } from '../../store/budget.service';
import { BudgetStore } from '../../store/budget.store';
import { BUDGET_PERIOD_ROWS, IBudgetPeriodRow } from '../../store/templates';

@Component({
  selector: 'budget-table',
  templateUrl: 'budget-table.html',
  styleUrls: ['./budget-table.scss'],
  standalone: false,
})
export class BudgetTableComponent {
  store = inject(BudgetStore);
  service = inject(BudgetService);

  @Input() budget: IBudget;
  rows = BUDGET_PERIOD_ROWS;

  cellClicked = output<{ activePeriod: number; activeType: IBudgetPeriodType }>();

  public emitCellClicked(columnIndex: number, row: IBudgetPeriodRow) {
    this.cellClicked.emit({ activePeriod: columnIndex, activeType: row.type });
  }
}
