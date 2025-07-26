import { Component, Input, output } from '@angular/core';

import { IBudget } from '../../models/budget-tool.models';
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
  @Input() budget: IBudget;
  rows = BUDGET_PERIOD_ROWS;

  cellClicked = output();

  constructor(
    public store: BudgetStore,
    public service: BudgetService,
  ) {}

  public onCellClick(columnIndex: number, row: IBudgetPeriodRow) {
    this.service.activePeriod.set(columnIndex);
    this.service.activeType.set(row.type);
    this.cellClicked.emit();
  }
}
