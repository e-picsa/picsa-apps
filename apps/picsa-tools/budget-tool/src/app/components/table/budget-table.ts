import { Component, Input } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { IBudget } from '../../models/budget-tool.models';
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

  constructor(public store: BudgetStore, private router: Router, private route: ActivatedRoute) {}

  public onCellClick(columnIndex: number, row: IBudgetPeriodRow) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        edit: true,
        period: columnIndex,
        label: this.store.periodLabels[columnIndex],
        type: row.type,
      },
      // just to make explicit, when navigating from main budget page want to keep history
      // to go back to full budget. This is different than once in editor
      replaceUrl: false,
    });
  }
}
